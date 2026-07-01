package com.vampz.stocksprout.security.refresh;

import com.vampz.stocksprout.appuser.AppUser;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Optional;
import java.util.UUID;

@Service
@AllArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${jwt.refresh-token-expiration:604800000}") // 7 days default (in milliseconds)
    private long refreshTokenExpiration;

    /**
     * Create a new refresh token for a user
     * @return the raw token (unhashed)
     */
    @Transactional
    public String createRefreshToken(AppUser user) {
        String rawToken = UUID.randomUUID().toString();
        String tokenHash = hashToken(rawToken);
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(refreshTokenExpiration / 1000);

        RefreshToken refreshToken = new RefreshToken(user, tokenHash, expiresAt);
        refreshTokenRepository.save(refreshToken);

        return rawToken;
    }

    /**
     * Validate a refresh token
     * @return the RefreshToken entity if valid, empty otherwise
     */
    @Transactional(readOnly = true)
    public Optional<RefreshToken> validateRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        return refreshTokenRepository.findByTokenHash(tokenHash)
                .filter(RefreshToken::isValid);
    }

    /**
     * Revoke a refresh token
     */
    @Transactional
    public void revokeRefreshToken(String rawToken) {
        String tokenHash = hashToken(rawToken);
        refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(RefreshToken::revoke);
    }

    /**
     * Revoke all tokens for a user
     */
    @Transactional
    public void revokeAllTokensForUser(AppUser user) {
        refreshTokenRepository.revokeAllTokensForUser(user, LocalDateTime.now());
    }

    /**
     * Clean up expired and revoked tokens
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional
    public void cleanupExpiredTokens() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(30);
        refreshTokenRepository.deleteExpiredOrRevokedTokens(cutoff);
    }

    /**
     * Hash a token using SHA-256
     */
    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}
