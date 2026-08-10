package com.example.back_end.admin.infrastructure.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.back_end.auth.domain.User;
import com.example.back_end.auth.domain.enums.RoleName;

@Repository
public interface AdminUserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailAndIsDeletedFalse(String email, Boolean isDeleted);

    Optional<User> findByIdAndIsDeletedFalse(Long id);

    boolean existsUsersByEmail(String email);

    @Query("SELECT DISTINCT u FROM User u JOIN u.roles r WHERE r.roleName = :roleName")
    List<User> findAllByRoleName(@Param("roleName") RoleName roleName);

    long countByIsDeletedFalse();

    @Query(value = """
            SELECT COUNT(DISTINCT u.user_id)
            FROM users u
            JOIN user_role ur ON ur.user_id = u.user_id
            JOIN roles r ON r.role_id = ur.role_id
            WHERE u.is_deleted = false
              AND CAST(r.role_name AS text) = 'ROLE_TEACHER'
            """, nativeQuery = true)
    long countActiveTeachers();

    @Query(value = """
            SELECT CAST(r.role_name AS text) AS role_name, COUNT(DISTINCT u.user_id) AS total
            FROM users u
            JOIN user_role ur ON ur.user_id = u.user_id
            JOIN roles r ON r.role_id = ur.role_id
            WHERE u.is_deleted = false
            GROUP BY CAST(r.role_name AS text)
            """, nativeQuery = true)
    List<Object[]> countActiveUsersByRoleName();

    @Query(value = """
            SELECT
              u.user_id,
              u.full_name,
              u.email,
              COALESCE(MIN(CAST(r.role_name AS text)), 'ROLE_USER') AS role_name
            FROM users u
            LEFT JOIN user_role ur ON ur.user_id = u.user_id
            LEFT JOIN roles r ON r.role_id = ur.role_id
            WHERE u.is_deleted = false
            GROUP BY u.user_id, u.full_name, u.email, u.created_at
            ORDER BY u.created_at DESC
            LIMIT 4
            """, nativeQuery = true)
    List<Object[]> findRecentActiveUserRows();

    @Query(value = """
            SELECT
              u.user_id,
              u.full_name,
              u.email,
              u.created_at,
              COALESCE(MIN(CAST(r.role_name AS text)), 'ROLE_USER') AS role_name
            FROM users u
            LEFT JOIN user_role ur ON ur.user_id = u.user_id
            LEFT JOIN roles r ON r.role_id = ur.role_id
            WHERE u.is_deleted = false
            GROUP BY u.user_id, u.full_name, u.email, u.created_at
            ORDER BY u.created_at DESC
            LIMIT 4
            """, nativeQuery = true)
    List<Object[]> findRecentUserActivityRows();

    @Query(value = """
            WITH month_range AS (
              SELECT generate_series(1, 12) AS month_number
            )
            SELECT
              mr.month_number,
              COALESCE(COUNT(DISTINCT u.user_id), 0) AS total
            FROM month_range mr
            LEFT JOIN users u
              ON u.is_deleted = false
              AND u.created_at >= make_date(:yearParam, mr.month_number, 1)
              AND u.created_at < make_date(:yearParam, mr.month_number, 1) + INTERVAL '1 month'
            GROUP BY mr.month_number
            ORDER BY mr.month_number
            """, nativeQuery = true)
    List<Object[]> countActiveUsersByMonth(
            @Param("yearParam") Integer year
    );
}
