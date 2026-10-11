package com.vibefinance.api.data;

import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/db")
public class DataController {

	private final DataService data;

	public DataController(DataService data) {
		this.data = data;
	}

	@PostMapping("/query")
	public Map<String, Object> query(Authentication authentication, @RequestBody QueryRequest query) {
		return Map.of("data", data.execute(authentication.getName(), query));
	}
}
