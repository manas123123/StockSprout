package com.vampz.stocksprout.security.jwt;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class JwtServiceTest {

    @InjectMocks
    private JwtService jwtService;

    private static final String TEST_SECRET = "this-is-a-test-secret-key-that-is-at-least-256-bits-long-for-hs256-signing";

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(jwtService, "secret", TEST_SECRET);
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 3600000L); // 1 hour
    }

    @Test
    void generateAccessToken_ShouldProduceValidToken() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "USER";

        String token = jwtService.generateAccessToken(userId, email, role);

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void validateToken_WithValidToken_ShouldReturnTrue() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "USER";
        String token = jwtService.generateAccessToken(userId, email, role);

        boolean isValid = jwtService.validateToken(token);

        assertTrue(isValid);
    }

    @Test
    void validateToken_WithExpiredToken_ShouldReturnFalse() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "USER";

        // Set expiration to -1 hour (already expired)
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", -3600000L);
        String token = jwtService.generateAccessToken(userId, email, role);

        boolean isValid = jwtService.validateToken(token);

        assertFalse(isValid);
    }

    @Test
    void validateToken_WithTamperedToken_ShouldReturnFalse() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "USER";
        String token = jwtService.generateAccessToken(userId, email, role);

        // Tamper with the token
        String tamperedToken = token + "tampered";

        boolean isValid = jwtService.validateToken(tamperedToken);

        assertFalse(isValid);
    }

    @Test
    void validateToken_WithInvalidSignature_ShouldReturnFalse() {
        // Token signed with different secret
        String invalidToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGV4YW1wbGUuY29tIiwidXNlcl9pZCI6MTIzLCJyb2xlIjoiVVNFUiIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxNjAwMDAzNjAwfQ.invalidsignature";

        boolean isValid = jwtService.validateToken(invalidToken);

        assertFalse(isValid);
    }

    @Test
    void extractClaims_WithValidToken_ShouldReturnClaims() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "USER";
        String token = jwtService.generateAccessToken(userId, email, role);

        var claims = jwtService.extractClaims(token);

        assertNotNull(claims);
        assertEquals(email, claims.getSubject());
        assertEquals(userId, claims.get("user_id"));
        assertEquals(role, claims.get("role"));
    }

    @Test
    void extractClaims_WithInvalidToken_ShouldReturnNull() {
        String invalidToken = "invalid.token.string";

        var claims = jwtService.extractClaims(invalidToken);

        assertNull(claims);
    }

    @Test
    void extractEmail_ShouldReturnCorrectEmail() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "USER";
        String token = jwtService.generateAccessToken(userId, email, role);

        String extractedEmail = jwtService.extractEmail(token);

        assertEquals(email, extractedEmail);
    }

    @Test
    void extractUserId_ShouldReturnCorrectUserId() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "USER";
        String token = jwtService.generateAccessToken(userId, email, role);

        Long extractedUserId = jwtService.extractUserId(token);

        assertEquals(userId, extractedUserId);
    }

    @Test
    void extractRole_ShouldReturnCorrectRole() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "ADMIN";
        String token = jwtService.generateAccessToken(userId, email, role);

        String extractedRole = jwtService.extractRole(token);

        assertEquals(role, extractedRole);
    }

    @Test
    void isTokenExpired_WithValidToken_ShouldReturnFalse() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "USER";
        String token = jwtService.generateAccessToken(userId, email, role);

        boolean isExpired = jwtService.isTokenExpired(token);

        assertFalse(isExpired);
    }

    @Test
    void isTokenExpired_WithExpiredToken_ShouldReturnTrue() {
        Long userId = 123L;
        String email = "test@example.com";
        String role = "USER";

        // Set expiration to -1 hour (already expired)
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", -3600000L);
        String token = jwtService.generateAccessToken(userId, email, role);

        boolean isExpired = jwtService.isTokenExpired(token);

        assertTrue(isExpired);
    }
}
