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
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.csrf.CsrfTokenRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

import static com.vampz.stocksprout.security.auth.AuthCookieService.REFRESH_TOKEN_COOKIE;

@RestController
@RequestMapping("api/auth")
@AllArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder bCryptPasswordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final PortfolioService portfolioService;
    private final AuthCookieService authCookieService;
    private final CsrfTokenRepository csrfTokenRepository;

    /**
     * GET /api/auth/csrf
     * Creates the non-secret CSRF cookie used by the browser for unsafe requests.
     */
    @GetMapping("/csrf")
    @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
    public void csrf(CsrfToken csrfToken) {
        csrfToken.getToken();
    }

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
                        Map<String, Object> result = new HashMap<>();
                        result.put("status", "error");
                        result.put("message", "Invalid email or password");
                        return result;
                    }

                    // Generate tokens
                    String accessToken = jwtService.generateAccessToken(
                            user.getId(),
                            user.getEmail(),
                            user.getRole().name()
                    );
                    String refreshToken = refreshTokenService.createRefreshToken(user);

                    // Set cookies
                    authCookieService.addAccessToken(httpResponse, accessToken);
                    authCookieService.addRefreshToken(httpResponse, refreshToken);
                    csrfTokenRepository.saveToken(null, httpRequest, httpResponse);

                    // Refresh portfolio
                    portfolioService.refresh(user.getPortfolio());

                    Map<String, Object> result = new HashMap<>();
                    result.put("status", "success");
                    result.put("message", "Login successful");

                    Map<String, Object> userData = new HashMap<>();
                    userData.put("firstName", user.getFirstName());
                    userData.put("lastName", user.getLastName());
                    userData.put("email", user.getEmail());
                    result.put("user", userData);

                    return result;
                })
                .orElseGet(() -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("status", "error");
                    result.put("message", "Invalid email or password");
                    return result;
                });
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
        authCookieService.addAccessToken(response, accessToken);
        csrfTokenRepository.saveToken(null, request, response);

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("message", "Token refreshed");
        return result;
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
        authCookieService.clearAccessToken(response);
        authCookieService.clearRefreshToken(response);
        csrfTokenRepository.saveToken(null, request, response);

        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");
        result.put("message", "Logged out");
        return result;
    }

    /**
     * GET /api/auth/me
     * Returns user from access token
     */
    @GetMapping("/me")
    public Map<String, Object> me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            Map<String, Object> result = new HashMap<>();
            result.put("status", "error");
            result.put("message", "Not authenticated");
            return result;
        }

        AppUser user = (AppUser) authentication.getPrincipal();
        Map<String, Object> result = new HashMap<>();
        result.put("status", "success");

        Map<String, Object> userData = new HashMap<>();
        userData.put("firstName", user.getFirstName());
        userData.put("lastName", user.getLastName());
        userData.put("email", user.getEmail());
        result.put("user", userData);

        return result;
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
