package com.vibefinance.api.data;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.sql.Timestamp;
import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vibefinance.api.common.ApiException;
import com.vibefinance.api.data.QueryRequest.Filter;
import com.vibefinance.api.data.QueryRequest.Order;

import tools.jackson.core.JacksonException;
import tools.jackson.databind.json.JsonMapper;

/**
 * Executa as consultas do front sobre as tabelas liberadas em {@link TablePolicy}. Tabelas e
 * colunas são validadas contra o schema real antes de entrar no SQL; valores sempre vão como
 * parâmetros; e todo acesso passa pelo predicado de leitura ou escrita da tabela.
 */
@Service
public class DataService {

	private static final int MAX_ROWS = 10_000;
	private static final Pattern ISO_DATE = Pattern.compile("^(\\d{4})-(\\d{2})-(\\d{2})$");
	private static final Set<String> NUMERIC_TYPES = Set.of("decimal", "int", "bigint", "smallint", "tinyint");
	private static final Set<String> DB_MANAGED = Set.of("created_at", "joined_at");
	private static final String INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

	private final NamedParameterJdbcTemplate jdbc;
	private final JsonMapper json;
	private final SecureRandom random = new SecureRandom();
	private volatile Map<String, Map<String, String>> schema;

	public DataService(NamedParameterJdbcTemplate jdbc, JsonMapper json) {
		this.jdbc = jdbc;
		this.json = json;
	}

	@Transactional
	public List<Map<String, Object>> execute(String uid, QueryRequest query) {
		String table = query.table();
		TablePolicy policy = table == null ? null : TablePolicy.ALL.get(table);
		if (policy == null) {
			throw ApiException.badRequest("Tabela desconhecida: " + table);
		}
		return switch (query.op() == null ? "" : query.op()) {
			case "select" -> select(uid, table, policy, query);
			case "insert" -> insert(uid, table, policy, query);
			case "update" -> update(uid, table, policy, query);
			case "delete" -> delete(uid, table, policy, query);
			case "upsert" -> upsert(uid, table, policy, query);
			default -> throw ApiException.badRequest("Operação desconhecida: " + query.op());
		};
	}

	// ── Operações ────────────────────────────────────────────────────────────

	private List<Map<String, Object>> select(String uid, String table, TablePolicy policy, QueryRequest query) {
		Statement sql = new Statement(uid);
		sql.append("select ").append(selectList(table, query.columns()));
		sql.append(" from ").append(quote(table)).append(" where ").append(policy.readPredicate());
		appendFilters(sql, table, query.filtersOrEmpty());

		List<Order> order = query.orderOrEmpty();
		if (!order.isEmpty()) {
			sql.append(" order by ").append(order.stream()
				.map(o -> column(table, o.column()) + (o.ascending() ? " asc" : " desc"))
				.collect(Collectors.joining(", ")));
		}
		int limit = query.limit() == null ? MAX_ROWS : Math.clamp(query.limit(), 0, MAX_ROWS);
		sql.append(" limit ").append(String.valueOf(limit));

		return toOutput(table, jdbc.queryForList(sql.text(), sql.params));
	}

	private List<Map<String, Object>> insert(String uid, String table, TablePolicy policy, QueryRequest query) {
		List<String> ids = new ArrayList<>();
		for (Map<String, Object> row : rows(query.values())) {
			Map<String, Object> prepared = prepareInsert(uid, table, policy, row);
			insertRow(table, prepared);
			ids.add((String) prepared.get("id"));
		}
		return query.returning() ? selectByIds(table, ids) : List.of();
	}

	private List<Map<String, Object>> update(String uid, String table, TablePolicy policy, QueryRequest query) {
		if (!(query.values() instanceof Map<?, ?>)) {
			throw ApiException.badRequest("Update exige um objeto com os valores.");
		}
		Map<String, Object> changes = prepareUpdate(uid, table, policy, rows(query.values()).get(0));
		List<String> ids = writableIds(uid, table, policy, query.filtersOrEmpty());
		if (ids.isEmpty()) {
			return List.of();
		}
		updateRows(table, changes, ids);
		return query.returning() ? selectByIds(table, ids) : List.of();
	}

	private List<Map<String, Object>> delete(String uid, String table, TablePolicy policy, QueryRequest query) {
		List<String> ids = writableIds(uid, table, policy, query.filtersOrEmpty());
		if (!ids.isEmpty()) {
			jdbc.update("delete from " + quote(table) + " where `id` in (:ids)", new MapSqlParameterSource("ids", ids));
		}
		return List.of();
	}

	/** Insere ou, se já existir uma linha com os mesmos valores nas colunas de conflito, atualiza. */
	private List<Map<String, Object>> upsert(String uid, String table, TablePolicy policy, QueryRequest query) {
		List<String> conflict = query.onConflict() == null || query.onConflict().isEmpty() ? List.of("id")
				: query.onConflict();
		List<String> ids = new ArrayList<>();
		for (Map<String, Object> row : rows(query.values())) {
			Map<String, Object> prepared = prepareInsert(uid, table, policy, row);

			Statement find = new Statement(uid);
			find.append("select `id` from ").append(quote(table)).append(" where ").append(policy.writePredicate());
			for (String conflictColumn : conflict) {
				find.append(" and ").append(column(table, conflictColumn)).append(" <=> ")
					.append(find.param(prepared.get(conflictColumn)));
			}
			List<String> existing = jdbc.queryForList(find.text(), find.params, String.class);

			if (existing.isEmpty()) {
				insertRow(table, prepared);
				ids.add((String) prepared.get("id"));
			}
			else {
				Map<String, Object> changes = new LinkedHashMap<>();
				for (String key : row.keySet()) {
					if (!conflict.contains(key) && !policy.immutable().contains(key)) {
						changes.put(key, prepared.get(key));
					}
				}
				if (!changes.isEmpty()) {
					updateRows(table, changes, existing);
				}
				ids.addAll(existing);
			}
		}
		return query.returning() ? selectByIds(table, ids) : List.of();
	}

	// ── Preparação e validação das linhas ────────────────────────────────────

	private Map<String, Object> prepareInsert(String uid, String table, TablePolicy policy, Map<String, Object> row) {
		Map<String, Object> prepared = new LinkedHashMap<>();
		row.forEach((key, value) -> {
			if (!DB_MANAGED.contains(key)) {
				prepared.put(key, coerce(table, key, value));
			}
		});

		prepared.put("id", UUID.randomUUID().toString());
		if (policy.ownerColumn() != null) {
			prepared.put(policy.ownerColumn(), uid);
		}

		switch (table) {
			case "households" -> prepared.put("invite_code", newInviteCode());
			case "household_members" -> requireHouseholdCreator(uid, prepared.get("household_id"));
			case "spending_limits" -> {
				if ("household".equals(prepared.get("scope"))) {
					prepared.put("user_id", null);
					if (prepared.get("household_id") == null) {
						throw ApiException.badRequest("Limite da casa exige um grupo familiar.");
					}
				}
				else {
					prepared.put("scope", "personal");
					prepared.put("user_id", uid);
					prepared.put("household_id", null);
				}
			}
			default -> {
			}
		}
		if (!table.equals("household_members")) {
			requireMember(uid, prepared.get("household_id"));
		}
		requireVisibleCard(uid, prepared.get("card_id"));
		return prepared;
	}

	private Map<String, Object> prepareUpdate(String uid, String table, TablePolicy policy, Map<String, Object> row) {
		Map<String, Object> changes = new LinkedHashMap<>();
		row.forEach((key, value) -> {
			if (!policy.immutable().contains(key)) {
				changes.put(key, coerce(table, key, value));
			}
		});
		if (table.equals("spending_limits")) {
			changes.keySet().removeAll(Set.of("scope", "household_id"));
		}
		if (changes.isEmpty()) {
			throw ApiException.badRequest("Nenhum campo alterável foi enviado.");
		}
		requireMember(uid, changes.get("household_id"));
		requireVisibleCard(uid, changes.get("card_id"));
		return changes;
	}

	private void requireMember(String uid, Object householdId) {
		if (householdId != null && count("select count(*) from household_members where household_id = :id and user_id = :uid",
				uid, householdId) == 0) {
			throw ApiException.forbidden("Você não participa deste grupo familiar.");
		}
	}

	private void requireHouseholdCreator(String uid, Object householdId) {
		if (count("select count(*) from households where id = :id and created_by = :uid", uid, householdId) == 0) {
			throw ApiException.forbidden("Use o código de convite para entrar neste grupo familiar.");
		}
	}

	private void requireVisibleCard(String uid, Object cardId) {
		if (cardId != null && count("select count(*) from cards where id = :id and household_id in "
				+ TablePolicy.MY_HOUSEHOLDS, uid, cardId) == 0) {
			throw ApiException.forbidden("Cartão não encontrado neste grupo familiar.");
		}
	}

	private int count(String sql, String uid, Object id) {
		Integer result = jdbc.queryForObject(sql, new MapSqlParameterSource("uid", uid).addValue("id", id), Integer.class);
		return result == null ? 0 : result;
	}

	// ── SQL ──────────────────────────────────────────────────────────────────

	private void insertRow(String table, Map<String, Object> row) {
		Statement sql = new Statement(null);
		sql.append("insert into ").append(quote(table)).append(" (")
			.append(row.keySet().stream().map(c -> column(table, c)).collect(Collectors.joining(", ")))
			.append(") values (")
			.append(row.values().stream().map(sql::param).collect(Collectors.joining(", ")))
			.append(")");
		jdbc.update(sql.text(), sql.params);
	}

	private void updateRows(String table, Map<String, Object> changes, List<String> ids) {
		Statement sql = new Statement(null);
		sql.append("update ").append(quote(table)).append(" set ")
			.append(changes.entrySet().stream()
				.map(e -> column(table, e.getKey()) + " = " + sql.param(e.getValue()))
				.collect(Collectors.joining(", ")))
			.append(" where `id` in (").append(sql.param(ids)).append(")");
		jdbc.update(sql.text(), sql.params);
	}

	/** Ids das linhas que o usuário pode alterar e que casam com os filtros (filtro é obrigatório). */
	private List<String> writableIds(String uid, String table, TablePolicy policy, List<Filter> filters) {
		if (filters.isEmpty()) {
			throw ApiException.badRequest("Update e delete exigem ao menos um filtro.");
		}
		Statement sql = new Statement(uid);
		sql.append("select `id` from ").append(quote(table)).append(" where ").append(policy.writePredicate());
		appendFilters(sql, table, filters);
		return jdbc.queryForList(sql.text(), sql.params, String.class);
	}

	private List<Map<String, Object>> selectByIds(String table, List<String> ids) {
		if (ids.isEmpty()) {
			return List.of();
		}
		return toOutput(table, jdbc.queryForList("select * from " + quote(table) + " where `id` in (:ids)",
				new MapSqlParameterSource("ids", ids)));
	}

	private void appendFilters(Statement sql, String table, List<Filter> filters) {
		for (Filter filter : filters) {
			String column = column(table, filter.column());
			Object value = filter.value();
			String op = filter.op() == null ? "" : filter.op();
			sql.append(" and ");
			switch (op) {
				case "eq" -> sql.append(column).append(value == null ? " is null" : " = " + sql.param(coerce(table, filter.column(), value)));
				case "neq" -> sql.append(column).append(value == null ? " is not null" : " <> " + sql.param(coerce(table, filter.column(), value)));
				case "gt", "gte", "lt", "lte" -> sql.append(column).append(comparison(op)).append(operand(sql, table, filter));
				case "like", "ilike" -> sql.append(column).append(" like ").append(sql.param(String.valueOf(value)));
				case "is" -> sql.append(column).append(" is null");
				case "not.is" -> sql.append(column).append(" is not null");
				case "in" -> {
					if (!(value instanceof Collection<?> items) || items.isEmpty()) {
						sql.append("1 = 0");
					}
					else {
						sql.append(column).append(" in (")
							.append(sql.param(items.stream().map(item -> coerce(table, filter.column(), item)).toList()))
							.append(")");
					}
				}
				default -> throw ApiException.badRequest("Filtro desconhecido: " + op);
			}
		}
	}

	private static String comparison(String op) {
		return switch (op) {
			case "gt" -> " > ";
			case "gte" -> " >= ";
			case "lt" -> " < ";
			default -> " <= ";
		};
	}

	/** Em colunas numéricas, um valor que é o nome de outra coluna vira comparação entre colunas. */
	private String operand(Statement sql, String table, Filter filter) {
		Map<String, String> columns = columns(table);
		if (filter.value() instanceof String other && columns.containsKey(other)
				&& NUMERIC_TYPES.contains(columns.get(filter.column()))) {
			return quote(other);
		}
		return sql.param(coerce(table, filter.column(), filter.value()));
	}

	private String selectList(String table, List<String> requested) {
		if (requested == null || requested.isEmpty() || requested.contains("*")) {
			return "*";
		}
		return requested.stream().map(c -> column(table, c)).collect(Collectors.joining(", "));
	}

	// ── Schema e conversão de valores ────────────────────────────────────────

	private Map<String, String> columns(String table) {
		Map<String, Map<String, String>> loaded = schema;
		if (loaded == null) {
			Map<String, Map<String, String>> fresh = new LinkedHashMap<>();
			jdbc.query("""
					select table_name, column_name, data_type from information_schema.columns
					 where table_schema = database() and table_name in (:tables)
					 order by table_name, ordinal_position""",
					new MapSqlParameterSource("tables", TablePolicy.ALL.keySet()),
					rs -> {
						fresh.computeIfAbsent(rs.getString(1).toLowerCase(), t -> new LinkedHashMap<>())
							.put(rs.getString(2).toLowerCase(), rs.getString(3).toLowerCase());
					});
			schema = loaded = fresh;
		}
		return loaded.getOrDefault(table, Map.of());
	}

	/** Valida o nome contra o schema e devolve a coluna entre crases, pronta para o SQL. */
	private String column(String table, String name) {
		if (name == null || !columns(table).containsKey(name)) {
			throw ApiException.badRequest("Coluna desconhecida em " + table + ": " + name);
		}
		return quote(name);
	}

	private static String quote(String identifier) {
		return "`" + identifier + "`";
	}

	private Object coerce(String table, String column, Object value) {
		column(table, column);
		if (value == null) {
			return null;
		}
		String type = columns(table).get(column);
		boolean blank = value instanceof String text && text.isBlank();
		try {
			if (type.equals("json")) {
				return json.writeValueAsString(value);
			}
			if (value instanceof Map<?, ?> || value instanceof Collection<?>) {
				throw ApiException.badRequest("Valor inválido para " + column + ".");
			}
			if (type.equals("date")) {
				return blank ? null : parseDate(value.toString().trim());
			}
			if (type.equals("datetime") || type.equals("timestamp")) {
				return blank ? null : OffsetDateTime.parse(value.toString().trim()).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime();
			}
			if (NUMERIC_TYPES.contains(type)) {
				return blank ? null : new BigDecimal(value.toString().trim());
			}
			return value.toString();
		}
		catch (DateTimeException | NumberFormatException | JacksonException ex) {
			throw ApiException.badRequest("Valor inválido para " + column + ".");
		}
	}

	/** Aceita dias além do fim do mês (ex.: "2026-02-31", usado como teto de intervalo) e os ajusta. */
	private static LocalDate parseDate(String text) {
		Matcher matcher = ISO_DATE.matcher(text.length() > 10 ? text.substring(0, 10) : text);
		if (!matcher.matches()) {
			throw new DateTimeException("Data inválida: " + text);
		}
		YearMonth month = YearMonth.of(Integer.parseInt(matcher.group(1)), Integer.parseInt(matcher.group(2)));
		int day = Integer.parseInt(matcher.group(3));
		return month.atDay(Math.clamp(day, 1, month.lengthOfMonth()));
	}

	private List<Map<String, Object>> toOutput(String table, List<Map<String, Object>> rows) {
		Map<String, String> types = columns(table);
		for (Map<String, Object> row : rows) {
			row.replaceAll((column, value) -> switch (value) {
				case null -> null;
				case java.sql.Date date -> date.toLocalDate().toString();
				case LocalDate date -> date.toString();
				case LocalDateTime dateTime -> dateTime.toInstant(ZoneOffset.UTC).toString();
				case Timestamp timestamp -> timestamp.toLocalDateTime().toInstant(ZoneOffset.UTC).toString();
				case String text when "json".equals(types.get(column.toLowerCase())) -> json.readValue(text, Object.class);
				default -> value;
			});
		}
		return rows;
	}

	@SuppressWarnings("unchecked")
	private static List<Map<String, Object>> rows(Object values) {
		List<?> items = values instanceof List<?> list ? list : values == null ? List.of() : List.of(values);
		if (items.isEmpty() || !items.stream().allMatch(Map.class::isInstance)) {
			throw ApiException.badRequest("Nenhum valor enviado.");
		}
		return (List<Map<String, Object>>) items;
	}

	private String newInviteCode() {
		StringBuilder code = new StringBuilder(8);
		for (int i = 0; i < 8; i++) {
			code.append(INVITE_ALPHABET.charAt(random.nextInt(INVITE_ALPHABET.length())));
		}
		return code.toString();
	}

	/** SQL em construção com seus parâmetros nomeados; :uid já vem preenchido quando informado. */
	private static final class Statement {

		private final StringBuilder text = new StringBuilder();
		private final MapSqlParameterSource params = new MapSqlParameterSource();

		private Statement(String uid) {
			if (uid != null) {
				params.addValue("uid", uid);
			}
		}

		private Statement append(String sql) {
			text.append(sql);
			return this;
		}

		private String param(Object value) {
			String name = "p" + params.getValues().size();
			params.addValue(name, value);
			return ":" + name;
		}

		private String text() {
			return text.toString();
		}
	}
}
