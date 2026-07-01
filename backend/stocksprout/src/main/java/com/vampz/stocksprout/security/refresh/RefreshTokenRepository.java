package com.vampz.stocksprout.security.refresh;

import com.vampz.stocksprout.appuser.AppUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * Find refresh token by hash
     */
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * Find all valid (non-expired, non-revoked) tokens for a user
     */
    @Query("SELECT rt FROM RefreshToken rt WHERE rt.user = :user AND rt.expiresAt > :now AND rt.revokedAt IS NULL")
    List<RefreshToken> findValidTokensByUser(@Param("user") AppUser user, @Param("now") LocalDateTime now);

    /**
     * Delete all expired or revoked tokens older than given date
     */
    @Modifying
    @Transactional
    @Query("DELETE FROM RefreshToken rt WHERE rt.revokedAt IS NOT NULL AND rt.revokedAt < :cutoff OR rt.expiresAt < :cutoff")
    void deleteExpiredOrRevokedTokens(@Param("cutoff") LocalDateTime cutoff);

    /**
     * Revoke all tokens for a user
     */
    @Modifying
    @Transactional
    @Query("UPDATE RefreshToken rt SET rt.revokedAt = :now WHERE rt.user = :user AND rt.revokedAt IS NULL")
    void revokeAllTokensForUser(@Param("user") AppUser user, @Param("now") LocalDateTime now);
}
