package com.vibefinance.api.data;

import java.util.List;

/** Consulta enviada pelo front: uma operação sobre uma tabela, com filtros e ordenação opcionais. */
public record QueryRequest(String table, String op, List<String> columns, List<Filter> filters, List<Order> order,
		Integer limit, Object values, List<String> onConflict, boolean returning) {

	public record Filter(String column, String op, Object value) {
	}

	public record Order(String column, boolean ascending) {
	}

	public List<Filter> filtersOrEmpty() {
		return filters == null ? List.of() : filters;
	}

	public List<Order> orderOrEmpty() {
		return order == null ? List.of() : order;
	}
}
