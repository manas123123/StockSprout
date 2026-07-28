package com.vampz.stocksprout.security.auth;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Set;

@Component
@ConfigurationProperties(prefix = "app.auth.cookie")
public class AuthCookieProperties {

    private static final Set<String> SUPPORTED_SAME_SITE_VALUES = Set.of("lax", "strict", "none");

    private boolean secure;
    private String sameSite = "Lax";

    public boolean isSecure() {
        return secure;
    }

    public void setSecure(boolean secure) {
        this.secure = secure;
    }

    public String getSameSite() {
        String normalized = sameSite == null ? "" : sameSite.trim().toLowerCase(Locale.ROOT);
        if (!SUPPORTED_SAME_SITE_VALUES.contains(normalized)) {
            throw new IllegalStateException("app.auth.cookie.same-site must be Lax, Strict, or None");
        }
        if ("none".equals(normalized) && !secure) {
            throw new IllegalStateException("SameSite=None requires app.auth.cookie.secure=true");
        }
        return Character.toUpperCase(normalized.charAt(0)) + normalized.substring(1);
    }

    public void setSameSite(String sameSite) {
        this.sameSite = sameSite;
    }
}
