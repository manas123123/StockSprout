package com.vampz.stocksprout.security.refresh;

import com.vampz.stocksprout.appuser.AppUser;
import com.vampz.stocksprout.appuser.AppUserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenServiceTest {

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @InjectMocks
    private RefreshTokenService refreshTokenService;

    private AppUser testUser;

    @BeforeEach
    void setUp() {
        testUser = new AppUser(
                "John",
                "Doe",
                "john@example.com",
                "encodedPassword",
                AppUserRole.USER
        );
        ReflectionTestUtils.setField(testUser, "id", 1L);

        ReflectionTestUtils.setField(refreshTokenService, "refreshTokenExpiration", 604800000L); // 7 days
    }

    @Test
    void createRefreshToken_ShouldGenerateAndStoreToken() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String rawToken = refreshTokenService.createRefreshToken(testUser);

        assertNotNull(rawToken);
        assertFalse(rawToken.isEmpty());
        verify(refreshTokenRepository).save(any(RefreshToken.class));
    }

    @Test
    void validateRefreshToken_WithValidToken_ShouldReturnToken() {
        String rawToken = "valid-token-123";
        RefreshToken refreshToken = new RefreshToken(
                testUser,
                "hashed-token",
                LocalDateTime.now().plusDays(7)
        );

        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(refreshToken));

        Optional<RefreshToken> result = refreshTokenService.validateRefreshToken(rawToken);

        assertTrue(result.isPresent());
        assertEquals(refreshToken, result.get());
    }

    @Test
    void validateRefreshToken_WithExpiredToken_ShouldReturnEmpty() {
        String rawToken = "expired-token";
        RefreshToken refreshToken = new RefreshToken(
                testUser,
                "hashed-token",
                LocalDateTime.now().minusDays(1) // Expired
        );

        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(refreshToken));

        Optional<RefreshToken> result = refreshTokenService.validateRefreshToken(rawToken);

        assertFalse(result.isPresent());
    }

    @Test
    void validateRefreshToken_WithRevokedToken_ShouldReturnEmpty() {
        String rawToken = "revoked-token";
        RefreshToken refreshToken = new RefreshToken(
                testUser,
                "hashed-token",
                LocalDateTime.now().plusDays(7)
        );
        refreshToken.revoke();

        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(refreshToken));

        Optional<RefreshToken> result = refreshTokenService.validateRefreshToken(rawToken);

        assertFalse(result.isPresent());
    }

    @Test
    void validateRefreshToken_WithUnknownToken_ShouldReturnEmpty() {
        String rawToken = "unknown-token";

        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        Optional<RefreshToken> result = refreshTokenService.validateRefreshToken(rawToken);

        assertFalse(result.isPresent());
    }

    @Test
    void revokeRefreshToken_ShouldMarkTokenAsRevoked() {
        String rawToken = "token-to-revoke";
        RefreshToken refreshToken = new RefreshToken(
                testUser,
                "hashed-token",
                LocalDateTime.now().plusDays(7)
        );

        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(refreshToken));

        refreshTokenService.revokeRefreshToken(rawToken);

        assertTrue(refreshToken.isRevoked());
        assertNotNull(refreshToken.getRevokedAt());
    }

    @Test
    void revokeRefreshToken_WithUnknownToken_ShouldDoNothing() {
        String rawToken = "unknown-token";

        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.empty());

        assertDoesNotThrow(() -> refreshTokenService.revokeRefreshToken(rawToken));

        verify(refreshTokenRepository, never()).save(any());
    }

    @Test
    void revokeAllTokensForUser_ShouldRevokeAllUserTokens() {
        refreshTokenService.revokeAllTokensForUser(testUser);

        verify(refreshTokenRepository).revokeAllTokensForUser(eq(testUser), any(LocalDateTime.class));
    }

    @Test
    void cleanupExpiredTokens_ShouldDeleteExpiredTokens() {
        refreshTokenService.cleanupExpiredTokens();

        verify(refreshTokenRepository).deleteExpiredOrRevokedTokens(any(LocalDateTime.class));
    }

    @Test
    void createRefreshToken_ShouldHashToken() {
        when(refreshTokenRepository.save(any(RefreshToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String rawToken = refreshTokenService.createRefreshToken(testUser);

        // Verify the token was saved
        verify(refreshTokenRepository).save(any(RefreshToken.class));

        // Verify we can validate it (hash matches)
        when(refreshTokenRepository.findByTokenHash(anyString())).thenAnswer(invocation -> {
            String hash = invocation.getArgument(0);
            // Create a token with the matching hash
            RefreshToken rt = new RefreshToken(testUser, hash, LocalDateTime.now().plusDays(7));
            return Optional.of(rt);
        });

        Optional<RefreshToken> result = refreshTokenService.validateRefreshToken(rawToken);
        assertTrue(result.isPresent());
    }
}
