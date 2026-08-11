package com.example.back_end.auth.infrastructure.persistence;

import com.example.back_end.auth.domain.Role;
import com.example.back_end.auth.domain.enums.RoleName;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RoleRepository extends JpaRepository<Role, Long> {

    Optional<Role> findByRoleName(RoleName roleName);

}