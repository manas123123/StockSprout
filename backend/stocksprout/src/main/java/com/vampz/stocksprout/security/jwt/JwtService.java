package com.vampz.stocksprout.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiration:3600000}") // 1 hour default
    private long accessTokenExpiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Generate an access token with user claims
     */
    public String generateAccessToken(Long userId, String email, String role) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("user_id", userId);
        claims.put("role", role);

        return Jwts.builder()
                .claims(claims)
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiration))
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Validate token signature and expiration
     * @return true if token is valid
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (ExpiredJwtException e) {
            // Token expired
            return false;
        } catch (SignatureException | MalformedJwtException e) {
            // Invalid signature or malformed token
            return false;
        } catch (Exception e) {
            // Other parsing errors
            return false;
        }
    }

    /**
     * Extract claims from a valid token
     * @return Claims object or null if token is invalid
     */
    public Claims extractClaims(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Extract user email (subject) from token
     */
    public String extractEmail(String token) {
        Claims claims = extractClaims(token);
        return claims != null ? claims.getSubject() : null;
    }

    /**
     * Extract user ID from token
     */
    public Long extractUserId(String token) {
        Claims claims = extractClaims(token);
        if (claims != null && claims.get("user_id") != null) {
            return claims.get("user_id", Long.class);
        }
        return null;
    }

    /**
     * Extract user role from token
     */
    public String extractRole(String token) {
        Claims claims = extractClaims(token);
        if (claims != null && claims.get("role") != null) {
            return claims.get("role", String.class);
        }
        return null;
    }

    /**
     * Check if token is expired
     */
    public boolean isTokenExpired(String token) {
        try {
            Claims claims = extractClaims(token);
            if (claims != null) {
                return claims.getExpiration().before(new Date());
            }
            return true;
        } catch (Exception e) {
            return true;
        }
    }
}
