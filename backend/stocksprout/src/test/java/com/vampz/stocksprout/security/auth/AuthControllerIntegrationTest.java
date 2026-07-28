package com.vampz.stocksprout.security.auth;

import com.vampz.stocksprout.appuser.AppUser;
import com.vampz.stocksprout.appuser.AppUserRole;
import com.vampz.stocksprout.appuser.UserRepository;
import com.vampz.stocksprout.domain.portfolioMVC.PortfolioService;
import com.vampz.stocksprout.security.jwt.JwtService;
import com.vampz.stocksprout.security.refresh.RefreshToken;
import com.vampz.stocksprout.security.refresh.RefreshTokenService;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerIntegrationTest {

    private static final String EMAIL = "user@example.test";
    private static final String PASSWORD = "correct-password";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    @MockBean
    private UserRepository userRepository;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private RefreshTokenService refreshTokenService;

    @MockBean
    private PortfolioService portfolioService;

    private AppUser user;

    @BeforeEach
    void setUp() {
        user = new AppUser(
                "Test",
                "User",
                EMAIL,
                passwordEncoder.encode(PASSWORD),
                AppUserRole.USER
        );
        user.setId(42L);
        user.setEnabled(true);
    }

    @Test
    void csrfEndpointCreatesJavaScriptReadableCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isNoContent())
                .andReturn();

        Cookie csrfCookie = result.getResponse().getCookie("XSRF-TOKEN");
        assertThat(csrfCookie).isNotNull();
        assertThat(csrfCookie.getPath()).isEqualTo("/");
        assertThat(csrfCookie.getAttribute("SameSite")).isEqualTo("Lax");
        assertThat(csrfCookie.isHttpOnly()).isFalse();
        assertThat(csrfCookie.getSecure()).isFalse();
    }

    @Test
    void loginWithoutCsrfTokenIsRejected() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson()))
                .andExpect(status().isForbidden());
    }

    @Test
    void loginWithCsrfSetsScopedHttpOnlyTokenCookies() throws Exception {
        when(userRepository.findByEmail(EMAIL)).thenReturn(Optional.of(user));
        when(jwtService.generateAccessToken(42L, EMAIL, AppUserRole.USER.name()))
                .thenReturn("test-access-token");
        when(refreshTokenService.createRefreshToken(user)).thenReturn("test-refresh-token");

        CsrfCookie csrf = getCsrfCookie();
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .cookie(csrf.cookie())
                        .header("X-XSRF-TOKEN", csrf.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andReturn();

        assertLocalAuthCookie(setCookieHeader(result, AuthCookieService.ACCESS_TOKEN_COOKIE), "/api", 3600);
        assertLocalAuthCookie(setCookieHeader(result, AuthCookieService.REFRESH_TOKEN_COOKIE), "/api/auth", 604800);
        assertThat(setCookieHeader(result, "XSRF-TOKEN")).contains("Max-Age=0");
        verify(portfolioService).refresh(user.getPortfolio());
    }

    @Test
    void refreshWithCsrfReplacesAccessCookie() throws Exception {
        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        when(refreshTokenService.validateRefreshToken("test-refresh-token"))
                .thenReturn(Optional.of(refreshToken));
        when(jwtService.generateAccessToken(42L, EMAIL, AppUserRole.USER.name()))
                .thenReturn("new-test-access-token");

        CsrfCookie csrf = getCsrfCookie();
        MvcResult result = mockMvc.perform(post("/api/auth/refresh")
                        .cookie(
                                csrf.cookie(),
                                new Cookie(AuthCookieService.REFRESH_TOKEN_COOKIE, "test-refresh-token")
                        )
                        .header("X-XSRF-TOKEN", csrf.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andReturn();

        assertLocalAuthCookie(setCookieHeader(result, AuthCookieService.ACCESS_TOKEN_COOKIE), "/api", 3600);
        assertThat(setCookieHeader(result, "XSRF-TOKEN")).contains("Max-Age=0");
    }

    @Test
    void logoutWithCsrfRevokesRefreshTokenAndClearsCookies() throws Exception {
        CsrfCookie csrf = getCsrfCookie();
        MvcResult result = mockMvc.perform(post("/api/auth/logout")
                        .cookie(
                                csrf.cookie(),
                                new Cookie(AuthCookieService.ACCESS_TOKEN_COOKIE, "test-access-token"),
                                new Cookie(AuthCookieService.REFRESH_TOKEN_COOKIE, "test-refresh-token")
                        )
                        .header("X-XSRF-TOKEN", csrf.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andReturn();

        assertClearedAuthCookie(setCookieHeader(result, AuthCookieService.ACCESS_TOKEN_COOKIE), "/api");
        assertClearedAuthCookie(setCookieHeader(result, AuthCookieService.REFRESH_TOKEN_COOKIE), "/api/auth");
        assertThat(setCookieHeader(result, "XSRF-TOKEN")).contains("Max-Age=0");
        verify(refreshTokenService).revokeRefreshToken("test-refresh-token");
    }

    @Test
    void meUsesHttpOnlyAccessCookieAuthentication() throws Exception {
        when(jwtService.validateToken("test-access-token")).thenReturn(true);
        when(jwtService.extractUserId("test-access-token")).thenReturn(42L);
        when(jwtService.extractRole("test-access-token")).thenReturn(AppUserRole.USER.name());
        when(userRepository.findById(42L)).thenReturn(Optional.of(user));

        mockMvc.perform(get("/api/auth/me")
                        .cookie(new Cookie(AuthCookieService.ACCESS_TOKEN_COOKIE, "test-access-token")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("success"))
                .andExpect(jsonPath("$.user.email").value(EMAIL));
    }

    @Test
    void meWithoutAccessCookieIsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    private CsrfCookie getCsrfCookie() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/auth/csrf"))
                .andExpect(status().isNoContent())
                .andReturn();
        String header = setCookieHeader(result, "XSRF-TOKEN");
        String token = header.substring("XSRF-TOKEN=".length(), header.indexOf(';'));
        return new CsrfCookie(new Cookie("XSRF-TOKEN", token), token);
    }

    private String setCookieHeader(MvcResult result, String cookieName) {
        return result.getResponse().getHeaders(HttpHeaders.SET_COOKIE).stream()
                .filter(header -> header.startsWith(cookieName + "="))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Missing Set-Cookie header for " + cookieName));
    }

    private void assertLocalAuthCookie(String header, String path, long maxAgeSeconds) {
        assertThat(header)
                .contains("Path=" + path)
                .contains("Max-Age=" + maxAgeSeconds)
                .contains("HttpOnly")
                .contains("SameSite=Lax")
                .doesNotContain("Secure");
    }

    private void assertClearedAuthCookie(String header, String path) {
        assertThat(header)
                .contains("Path=" + path)
                .contains("Max-Age=0")
                .contains("HttpOnly")
                .contains("SameSite=Lax");
    }

    private String loginJson() {
        return """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(EMAIL, PASSWORD);
    }

    private record CsrfCookie(Cookie cookie, String token) {
    }
}
