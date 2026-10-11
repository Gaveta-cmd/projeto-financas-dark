package com.vibefinance.api.common;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

	@ExceptionHandler(ApiException.class)
	public ResponseEntity<Map<String, String>> handleApi(ApiException ex) {
		return body(ex.getStatus(), ex.getCode(), ex.getMessage());
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<Map<String, String>> handleIntegrity(DataIntegrityViolationException ex) {
		log.warn("Violação de integridade: {}", ex.getMostSpecificCause().getMessage());
		return body(HttpStatus.UNPROCESSABLE_ENTITY, "constraint_violation",
				"Os dados enviados não são válidos para este registro.");
	}

	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<Map<String, String>> handleUnreadable(HttpMessageNotReadableException ex) {
		return body(HttpStatus.BAD_REQUEST, "bad_request", "Requisição inválida.");
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, String>> handleUnexpected(Exception ex) {
		if (ex instanceof ErrorResponse framework) {
			HttpStatus status = HttpStatus.valueOf(framework.getStatusCode().value());
			return body(status, "http_" + status.value(), status.getReasonPhrase());
		}
		log.error("Erro inesperado", ex);
		return body(HttpStatus.INTERNAL_SERVER_ERROR, "internal_error", "Erro interno. Tente novamente.");
	}

	private ResponseEntity<Map<String, String>> body(HttpStatus status, String code, String message) {
		return ResponseEntity.status(status).body(Map.of("code", code, "message", message));
	}
}
