package com.vibefinance.api.rpc;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vibefinance.api.auth.AuthService;

@RestController
@RequestMapping("/api/rpc")
public class RpcController {

	public record JoinHousehold(String code, String nickname_param, BigDecimal income_param) {
	}

	private final HouseholdService households;
	private final AuthService auth;

	public RpcController(HouseholdService households, AuthService auth) {
		this.households = households;
		this.auth = auth;
	}

	@PostMapping("/join_household_by_code")
	public Map<String, Object> joinHousehold(Authentication authentication, @RequestBody JoinHousehold body) {
		return Map.of("data", households.joinByCode(authentication.getName(), body.code(), body.nickname_param(),
				body.income_param()));
	}

	@PostMapping("/delete_user")
	public Map<String, Object> deleteUser(Authentication authentication) {
		auth.deleteUser(authentication.getName());
		Map<String, Object> result = new HashMap<>();
		result.put("data", null);
		return result;
	}
}
