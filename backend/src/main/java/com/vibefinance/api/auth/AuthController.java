package com.vibefinance.api.auth;

import java.util.Map;

import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.vibefinance.api.security.TokenAuthFilter;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	public record Credentials(String email, String password, Map<String, Object> data) {
	}

	public record UserUpdate(String email, String password, Map<String, Object> data) {
	}

	private final AuthService auth;

	public AuthController(AuthService auth) {
		this.auth = auth;
	}

	@PostMapping("/signup")
	public Map<String, Object> signUp(@RequestBody Credentials body) {
		Map<String, Object> metadata = body.data() == null ? Map.of() : body.data();
		return Map.of("session", auth.signUp(body.email(), body.password(), metadata));
	}

	@PostMapping("/login")
	public Map<String, Object> signIn(@RequestBody Credentials body) {
		return Map.of("session", auth.signIn(body.email(), body.password()));
	}

	@PostMapping("/logout")
	public void signOut(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization) {
		auth.signOut(TokenAuthFilter.bearerToken(authorization));
	}

	@GetMapping("/user")
	public Map<String, Object> user(Authentication authentication) {
		return Map.of("user", auth.getUser(authentication.getName()));
	}

	@PutMapping("/user")
	public Map<String, Object> updateUser(Authentication authentication, @RequestBody UserUpdate body) {
		return Map.of("user", auth.updateUser(authentication.getName(), body.email(), body.password(), body.data()));
	}
}
