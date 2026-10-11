package com.vibefinance.api.security;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import com.vibefinance.api.auth.AuthService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/** Autentica a requisição pelo token de sessão enviado em "Authorization: Bearer ...". */
public class TokenAuthFilter extends OncePerRequestFilter {

	private static final String PREFIX = "Bearer ";

	private final AuthService auth;

	public TokenAuthFilter(AuthService auth) {
		this.auth = auth;
	}

	public static String bearerToken(String authorization) {
		if (authorization == null || !authorization.startsWith(PREFIX)) {
			return "";
		}
		return authorization.substring(PREFIX.length()).trim();
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String token = bearerToken(request.getHeader(HttpHeaders.AUTHORIZATION));
		if (!token.isEmpty()) {
			auth.resolveUserId(token).ifPresent(userId -> SecurityContextHolder.getContext()
				.setAuthentication(new UsernamePasswordAuthenticationToken(userId, null, List.of())));
		}
		chain.doFilter(request, response);
	}
}
