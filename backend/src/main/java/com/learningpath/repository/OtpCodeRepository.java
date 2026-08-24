package com.learningpath.repository;

import com.learningpath.entity.OtpCode;
import com.learningpath.entity.OtpPurpose;
import com.learningpath.entity.User;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OtpCodeRepository extends JpaRepository<OtpCode, UUID> {

    Optional<OtpCode> findTopByUserAndCodeAndPurposeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            User user, String code, OtpPurpose purpose, Instant now);

    List<OtpCode> findByUserAndPurposeAndUsedFalse(User user, OtpPurpose purpose);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE OtpCode o SET o.used = true WHERE o.user = :user AND o.purpose = :purpose AND o.used = false")
    void invalidateExistingOtps(@Param("user") User user, @Param("purpose") OtpPurpose purpose);
}
