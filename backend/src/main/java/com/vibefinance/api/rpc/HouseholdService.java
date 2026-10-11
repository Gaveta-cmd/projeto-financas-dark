package com.vibefinance.api.rpc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.vibefinance.api.common.ApiException;

@Service
public class HouseholdService {

	private final JdbcTemplate jdbc;

	public HouseholdService(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	/** Entra no grupo familiar pelo código de convite; repetir a chamada só atualiza apelido e renda. */
	@Transactional
	public String joinByCode(String userId, String code, String nickname, BigDecimal income) {
		List<String> ids = jdbc.queryForList("select id from households where invite_code = ?", String.class,
				code == null ? "" : code.trim().toUpperCase());
		if (ids.isEmpty()) {
			throw ApiException.badRequest("Código de convite inválido ou expirado.");
		}
		if (income == null || income.signum() < 0) {
			income = BigDecimal.ZERO;
		}
		String trimmed = nickname == null ? null : nickname.trim();
		if (trimmed != null && trimmed.length() > 40) {
			trimmed = trimmed.substring(0, 40);
		}

		String householdId = ids.get(0);
		jdbc.update("""
				insert into household_members (id, household_id, user_id, nickname, monthly_income, role)
				values (?, ?, ?, ?, ?, 'member')
				on duplicate key update nickname = values(nickname), monthly_income = values(monthly_income)""",
				UUID.randomUUID().toString(), householdId, userId, trimmed, income);
		jdbc.update("insert into profiles (id) select ? from dual where not exists (select 1 from profiles where id = ?)",
				userId, userId);
		jdbc.update("update profiles set household_id = ? where id = ?", householdId, userId);
		return householdId;
	}
}
