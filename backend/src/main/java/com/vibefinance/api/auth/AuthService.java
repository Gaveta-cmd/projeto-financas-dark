package com.vibefinance.api.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeParseException;
import java.util.Base64;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vibefinance.api.common.ApiException;

@Service
public class AuthService {

	private static final Pattern EMAIL = Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");
	private static final int MIN_PASSWORD = 8;
	private static final int MAX_PASSWORD = 72; // limite do bcrypt

	private final JdbcTemplate jdbc;
	private final PasswordEncoder passwordEncoder;
	private final SecureRandom random = new SecureRandom();
	private final int sessionDays;
	private final boolean signupEnabled;

	public AuthService(JdbcTemplate jdbc, PasswordEncoder passwordEncoder,
			@Value("${app.session.days}") int sessionDays,
			@Value("${app.signup.enabled}") boolean signupEnabled) {
		this.jdbc = jdbc;
		this.passwordEncoder = passwordEncoder;
		this.sessionDays = sessionDays;
		this.signupEnabled = signupEnabled;
	}

	@Transactional
	public Map<String, Object> signUp(String rawEmail, String password, Map<String, Object> metadata) {
		if (!signupEnabled) {
			throw ApiException.forbidden("O cadastro de novos usuários está desativado.");
		}
		String email = normalizeEmail(rawEmail);
		validatePassword(password);

		String id = UUID.randomUUID().toString();
		try {
			jdbc.update("insert into users (id, email, password_hash) values (?, ?, ?)",
					id, email, passwordEncoder.encode(password));
		}
		catch (DuplicateKeyException ex) {
			throw new ApiException(org.springframework.http.HttpStatus.CONFLICT, "user_already_exists",
					"User already registered");
		}
		jdbc.update("insert into profiles (id, full_name, birth_date) values (?, ?, ?)",
				id, trimToNull(metadata.get("full_name"), 120), parseDate(metadata.get("birth_date")));
		return newSession(id);
	}

	public Map<String, Object> signIn(String rawEmail, String password) {
		String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase();
		List<Map<String, Object>> rows = jdbc.queryForList(
				"select id, password_hash from users where email = ?", email);
		// Mensagem igual para e-mail inexistente e senha errada: não revela quais e-mails existem.
		if (rows.isEmpty() || password == null
				|| !passwordEncoder.matches(password, (String) rows.get(0).get("password_hash"))) {
			throw ApiException.badRequest("Invalid login credentials");
		}
		return newSession((String) rows.get(0).get("id"));
	}

	public void signOut(String token) {
		jdbc.update("delete from auth_sessions where token_hash = ?", hash(token));
	}

	public Optional<String> resolveUserId(String token) {
		List<String> ids = jdbc.queryForList(
				"select user_id from auth_sessions where token_hash = ? and expires_at > utc_timestamp(3)",
				String.class, hash(token));
		return ids.stream().findFirst();
	}

	public Map<String, Object> getUser(String userId) {
		List<Map<String, Object>> rows = jdbc.queryForList("""
				select u.id, u.email, u.created_at, p.full_name, p.birth_date
				  from users u left join profiles p on p.id = u.id
				 where u.id = ?""", userId);
		if (rows.isEmpty()) {
			throw ApiException.unauthorized("Sessão expirada. Faça login novamente.");
		}
		Map<String, Object> row = rows.get(0);
		Map<String, Object> metadata = new LinkedHashMap<>();
		metadata.put("full_name", row.get("full_name"));
		metadata.put("birth_date", row.get("birth_date") == null ? null : row.get("birth_date").toString());

		Map<String, Object> user = new LinkedHashMap<>();
		user.put("id", row.get("id"));
		user.put("email", row.get("email"));
		user.put("user_metadata", metadata);
		return user;
	}

	@Transactional
	public Map<String, Object> updateUser(String userId, String newEmail, String newPassword,
			Map<String, Object> metadata) {
		if (newEmail != null) {
			try {
				jdbc.update("update users set email = ? where id = ?", normalizeEmail(newEmail), userId);
			}
			catch (DuplicateKeyException ex) {
				throw ApiException.badRequest("Este e-mail já está em uso.");
			}
		}
		if (newPassword != null) {
			validatePassword(newPassword);
			jdbc.update("update users set password_hash = ? where id = ?",
					passwordEncoder.encode(newPassword), userId);
		}
		if (metadata != null) {
			jdbc.update("insert into profiles (id) select ? from dual where not exists (select 1 from profiles where id = ?)",
					userId, userId);
			if (metadata.containsKey("full_name")) {
				jdbc.update("update profiles set full_name = ? where id = ?",
						trimToNull(metadata.get("full_name"), 120), userId);
			}
			if (metadata.containsKey("birth_date")) {
				jdbc.update("update profiles set birth_date = ? where id = ?",
						parseDate(metadata.get("birth_date")), userId);
			}
		}
		return getUser(userId);
	}

	/**
	 * Remove a conta; as chaves estrangeiras apagam em cascata os dados do usuário. Um grupo
	 * familiar que fica sem nenhum membro é apagado junto, para não sobrar órfão.
	 */
	@Transactional
	public void deleteUser(String userId) {
		jdbc.update("delete from users where id = ?", userId);
		jdbc.update("delete from households where id not in (select household_id from household_members)");
	}

	private Map<String, Object> newSession(String userId) {
		byte[] bytes = new byte[32];
		random.nextBytes(bytes);
		String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
		LocalDateTime expiresAt = LocalDateTime.now(ZoneOffset.UTC).plusDays(sessionDays);

		jdbc.update("delete from auth_sessions where expires_at <= utc_timestamp(3)");
		jdbc.update("insert into auth_sessions (token_hash, user_id, expires_at) values (?, ?, ?)",
				hash(token), userId, expiresAt);

		Map<String, Object> session = new LinkedHashMap<>();
		session.put("access_token", token);
		session.put("expires_at", expiresAt.toEpochSecond(ZoneOffset.UTC));
		session.put("user", getUser(userId));
		return session;
	}

	/** O banco guarda só o hash do token: um vazamento da tabela não entrega sessões válidas. */
	private static String hash(String token) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			return HexFormat.of().formatHex(digest.digest(token.getBytes(StandardCharsets.UTF_8)));
		}
		catch (NoSuchAlgorithmException ex) {
			throw new IllegalStateException(ex);
		}
	}

	private static String normalizeEmail(String rawEmail) {
		String email = rawEmail == null ? "" : rawEmail.trim().toLowerCase();
		if (email.length() > 255 || !EMAIL.matcher(email).matches()) {
			throw ApiException.badRequest("Unable to validate email address: invalid format");
		}
		return email;
	}

	private static void validatePassword(String password) {
		if (password == null || password.length() < MIN_PASSWORD) {
			throw ApiException.badRequest("Password should be at least " + MIN_PASSWORD + " characters");
		}
		if (password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD) {
			throw ApiException.badRequest("A senha deve ter no máximo " + MAX_PASSWORD + " caracteres.");
		}
	}

	private static String trimToNull(Object value, int maxLength) {
		if (value == null) {
			return null;
		}
		String text = value.toString().trim();
		if (text.isEmpty()) {
			return null;
		}
		return text.length() > maxLength ? text.substring(0, maxLength) : text;
	}

	private static LocalDate parseDate(Object value) {
		if (value == null || value.toString().isBlank()) {
			return null;
		}
		try {
			return LocalDate.parse(value.toString().trim());
		}
		catch (DateTimeParseException ex) {
			throw ApiException.badRequest("Data inválida.");
		}
	}
}
