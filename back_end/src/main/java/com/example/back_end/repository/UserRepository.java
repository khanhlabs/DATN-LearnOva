package com.example.back_end.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import com.example.back_end.entity.User;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailAndIsDeletedFalse(String email);;

    boolean existsUsersByEmail(String email);

    @Query(value = "SELECT u.* FROM users u " +
                   "JOIN user_role ur ON u.user_id = ur.user_id " +
                   "JOIN roles r ON r.role_id = ur.role_id " +
                   "WHERE r.role_name = 'ROLE_TEACHER' AND u.is_deleted = FALSE " +
                   "ORDER BY u.user_id", nativeQuery = true)
    List<User> findAllTeachers();
    Optional<User> findByEmail(String email);

    @Query(value = "SELECT u.* FROM users u " +
                   "JOIN user_role ur ON u.user_id = ur.user_id " +
                   "JOIN roles r ON r.role_id = ur.role_id " +
                   "WHERE r.role_name = 'ROLE_ADMIN' AND u.is_deleted = FALSE " +
                   "ORDER BY u.user_id", nativeQuery = true)
    List<User> findAllAdmins();
}