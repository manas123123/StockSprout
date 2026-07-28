package com.vampz.stocksprout.security.auth;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockHttpServletResponse;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthCookieServiceTest {

    @Test
    void productionConfigurationAddsSecureFlag() {
        AuthCookieProperties properties = new AuthCookieProperties();
        properties.setSecure(true);
        AuthCookieService service = new AuthCookieService(properties, 3_600_000, 604_800_000);
        MockHttpServletResponse response = new MockHttpServletResponse();

        service.addAccessToken(response, "test-access-token");

        assertThat(response.getHeader(HttpHeaders.SET_COOKIE))
                .contains("Secure")
                .contains("HttpOnly")
                .contains("SameSite=Lax")
                .contains("Path=/api");
    }

    @Test
    void sameSiteNoneIsRejectedWithoutSecureCookies() {
        AuthCookieProperties properties = new AuthCookieProperties();
        properties.setSameSite("None");

        assertThatThrownBy(properties::getSameSite)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("requires app.auth.cookie.secure=true");
    }
}
