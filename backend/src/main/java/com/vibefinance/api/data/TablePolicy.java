package com.vibefinance.api.data;

import java.util.Map;
import java.util.Set;

/**
 * Regras de acesso de uma tabela exposta pela API. Os predicados são fragmentos SQL fixos
 * (nunca vêm do cliente) e usam o parâmetro :uid, o usuário autenticado.
 *
 * @param readPredicate  linhas que o usuário pode ler
 * @param writePredicate linhas que o usuário pode alterar ou apagar
 * @param ownerColumn    coluna forçada para o usuário autenticado no insert (ou null)
 * @param immutable      colunas que não podem ser alteradas depois do insert
 */
public record TablePolicy(String readPredicate, String writePredicate, String ownerColumn, Set<String> immutable) {

	/** Lares (households) dos quais o usuário participa. */
	static final String MY_HOUSEHOLDS = "(select hm.household_id from household_members hm where hm.user_id = :uid)";

	private static final String OWN = "user_id = :uid";
	private static final String OWN_OR_HOUSEHOLD = "(user_id = :uid or household_id in " + MY_HOUSEHOLDS + ")";
	private static final Set<String> BASE_IMMUTABLE = Set.of("id", "user_id", "created_at");

	static final Map<String, TablePolicy> ALL = Map.ofEntries(
			Map.entry("transactions", new TablePolicy(OWN_OR_HOUSEHOLD, OWN, "user_id", BASE_IMMUTABLE)),
			Map.entry("subscriptions", new TablePolicy(OWN, OWN, "user_id", BASE_IMMUTABLE)),
			Map.entry("installments", new TablePolicy(OWN, OWN, "user_id", BASE_IMMUTABLE)),
			Map.entry("goals", new TablePolicy(
					"(user_id = :uid or (scope = 'household' and household_id in " + MY_HOUSEHOLDS + "))",
					OWN, "user_id", BASE_IMMUTABLE)),
			Map.entry("spending_limits", new TablePolicy(OWN_OR_HOUSEHOLD, OWN_OR_HOUSEHOLD, null, BASE_IMMUTABLE)),
			Map.entry("budget_estimates", new TablePolicy(OWN_OR_HOUSEHOLD, OWN_OR_HOUSEHOLD, "user_id", BASE_IMMUTABLE)),
			Map.entry("cards", new TablePolicy("household_id in " + MY_HOUSEHOLDS, OWN, "user_id", BASE_IMMUTABLE)),
			Map.entry("households", new TablePolicy("id in " + MY_HOUSEHOLDS, "created_by = :uid", "created_by",
					Set.of("id", "created_by", "created_at", "invite_code"))),
			Map.entry("household_members", new TablePolicy("household_id in " + MY_HOUSEHOLDS, OWN, "user_id",
					Set.of("id", "user_id", "household_id", "role", "joined_at"))),
			Map.entry("profiles", new TablePolicy("(id = :uid or household_id in " + MY_HOUSEHOLDS + ")", "id = :uid",
					"id", Set.of("id", "created_at"))),
			Map.entry("user_onboarding", new TablePolicy(OWN, OWN, "user_id", Set.of("id", "user_id"))));
}
