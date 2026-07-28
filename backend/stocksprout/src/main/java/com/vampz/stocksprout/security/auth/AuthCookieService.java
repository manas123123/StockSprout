package com.vampz.stocksprout.security.auth;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
public class AuthCookieService {

    public static final String ACCESS_TOKEN_COOKIE = "access_token";
    public static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    private static final String ACCESS_TOKEN_PATH = "/api";
    private static final String REFRESH_TOKEN_PATH = "/api/auth";

    private final AuthCookieProperties properties;
    private final Duration accessTokenMaxAge;
    private final Duration refreshTokenMaxAge;

    public AuthCookieService(
            AuthCookieProperties properties,
            @Value("${jwt.access-token-expiration:3600000}") long accessTokenExpiration,
            @Value("${jwt.refresh-token-expiration:604800000}") long refreshTokenExpiration
    ) {
        this.properties = properties;
        this.accessTokenMaxAge = Duration.ofMillis(accessTokenExpiration);
        this.refreshTokenMaxAge = Duration.ofMillis(refreshTokenExpiration);
    }

    public void addAccessToken(HttpServletResponse response, String token) {
        addCookie(response, ACCESS_TOKEN_COOKIE, token, ACCESS_TOKEN_PATH, accessTokenMaxAge);
    }

    public void addRefreshToken(HttpServletResponse response, String token) {
        addCookie(response, REFRESH_TOKEN_COOKIE, token, REFRESH_TOKEN_PATH, refreshTokenMaxAge);
    }

    public void clearAccessToken(HttpServletResponse response) {
        addCookie(response, ACCESS_TOKEN_COOKIE, "", ACCESS_TOKEN_PATH, Duration.ZERO);
    }

    public void clearRefreshToken(HttpServletResponse response) {
        addCookie(response, REFRESH_TOKEN_COOKIE, "", REFRESH_TOKEN_PATH, Duration.ZERO);
    }

    private void addCookie(
            HttpServletResponse response,
            String name,
            String value,
            String path,
            Duration maxAge
    ) {
        ResponseCookie cookie = ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(properties.isSecure())
                .sameSite(properties.getSameSite())
                .path(path)
                .maxAge(maxAge)
                .build();
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
    }
}
