package com.example.back_end.entity;

import com.example.back_end.entity.enums.RoleName;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.type.SqlTypes;

import java.util.LinkedHashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "roles")
public class Role {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id", nullable = false)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "role_name", columnDefinition = "role_name not null")
    @org.hibernate.annotations.JdbcTypeCode(SqlTypes.NAMED_ENUM)
    private RoleName roleName;

    @ManyToMany(mappedBy = "roles")
    private Set<User> users = new LinkedHashSet<>();

}