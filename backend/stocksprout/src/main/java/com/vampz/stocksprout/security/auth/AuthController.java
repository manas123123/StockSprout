package com.vampz.stocksprout.security.auth;

import com.vampz.stocksprout.appuser.AppUser;
import com.vampz.stocksprout.appuser.UserRepository;
import com.vampz.stocksprout.domain.portfolioMVC.PortfolioService;
import com.vampz.stocksprout.security.jwt.JwtService;
import com.vampz.stocksprout.security.refresh.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("api/auth")
@AllArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PortfolioService portfolioService;

    private static final String ACCESS_TOKEN_COOKIE = "access_token";
    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";
    private static final int ACCESS_COOKIE_AGE = (int) Duration.ofHours(1).toSeconds(); // 1 hour
    private static final int REFRESH_COOKIE_AGE = (int) Duration.ofDays(7).toSeconds(); // 7 days

    /**
     * POST /api/auth/login
     * Validate credentials, create both tokens as cookies
     */
    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest request,
                                      HttpServletRequest httpRequest,
                                      HttpServletResponse httpResponse) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    boolean ok = bCryptPasswordEncoder.matches(request.getPassword(), user.getPassword());
                    if (!ok) {
                        return Map.of(
                                "status", "error",
                                "message", "Invalid email or password"
                        );
                    }

                    // Generate tokens
                    String accessToken = jwtService.generateAccessToken(
                            user.getId(),
                            user.getEmail(),
                            user.getRole().name()
                    );
                    String refreshToken = refreshTokenService.createRefreshToken(user);

                    // Set cookies
                    setAccessTokenCookie(httpResponse, accessToken);
                    setRefreshTokenCookie(httpResponse, refreshToken);

                    // Refresh portfolio
                    portfolioService.refresh(user.getPortfolio());

                    return Map.of(
                            "status", "success",
                            "message", "Login successful",
                            "user", Map.of(
                                    "firstName", user.getFirstName(),
                                    "lastName", user.getLastName(),
                                    "email", user.getEmail()
                            )
                    );
                })
                .orElse(Map.of(
                        "status", "error",
                        "message", "Invalid email or password"
                ));
    }

    /**
     * POST /api/auth/refresh
     * Takes refresh cookie, returns new access cookie
     */
    @PostMapping("/refresh")
    public Map<String, Object> refresh(HttpServletRequest request,
                                        HttpServletResponse response) {
        String refreshToken = extractRefreshToken(request);

        if (refreshToken == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return Map.of();
        }

        var tokenOpt = refreshTokenService.validateRefreshToken(refreshToken);
        if (tokenOpt.isEmpty()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return Map.of();
        }

        AppUser user = tokenOpt.get().getUser();

        // Generate new access token
        String accessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        // Set new access cookie
        setAccessTokenCookie(response, accessToken);

        return Map.of(
                "status", "success",
                "message", "Token refreshed"
        );
    }

    /**
     * POST /api/auth/logout
     * Revokes refresh token, clears cookies
     */
    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletRequest request,
                                       HttpServletResponse response) {
        String refreshToken = extractRefreshToken(request);

        if (refreshToken != null) {
            refreshTokenService.revokeRefreshToken(refreshToken);
        }

        // Clear cookies
        clearAccessCookie(response);
        clearRefreshCookie(response);

        return Map.of(
                "status", "success",
                "message", "Logged out"
        );
    }

    /**
     * GET /api/auth/me
     * Returns user from access token
     */
    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return Map.of(
                    "status", "error",
                    "message", "Not authenticated"
            );
        }

        AppUser user = (AppUser) authentication.getPrincipal();
        return Map.of(
                "status", "success",
                "user", Map.of(
                        "firstName", user.getFirstName(),
                        "lastName", user.getLastName(),
                        "email", user.getEmail()
                )
        );
    }

    /**
     * Set access token cookie (regular cookie for React compatibility)
     */
    private void setAccessTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(ACCESS_TOKEN_COOKIE, token);
        cookie.setHttpOnly(false); // Required for React to access via document.cookie
        cookie.setSecure(true);   // HTTPS only in production
        cookie.setPath("/");
        cookie.setMaxAge(ACCESS_COOKIE_AGE);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    /**
     * Set refresh token cookie (HTTP-only for security)
     */
    private void setRefreshTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, token);
        cookie.setHttpOnly(true);  // Not accessible via JavaScript
        cookie.setSecure(true);    // HTTPS only in production
        cookie.setPath("/");
        cookie.setMaxAge(REFRESH_COOKIE_AGE);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    /**
     * Clear access token cookie
     */
    private void clearAccessCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(ACCESS_TOKEN_COOKIE, "");
        cookie.setHttpOnly(false);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    /**
     * Clear refresh token cookie
     */
    private void clearRefreshCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    /**
     * Extract refresh token from cookie
     */
    private String extractRefreshToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (REFRESH_TOKEN_COOKIE.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }
}
