package com.example.back_end.security;

import com.example.back_end.entity.Role;
import com.example.back_end.entity.User;
import com.example.back_end.entity.enums.RoleName;
import org.jspecify.annotations.NullMarked;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import lombok.Getter;
import lombok.Setter;

import java.util.Collection;
import java.util.List;

@Getter
@Setter
public class CustomUserDetails implements UserDetails{
  private User user;

  public CustomUserDetails(User user) {
    this.user = user;
  }

  public Long getId() {
    return user.getId();
  }

  public String getFullName(){
    return user.getFullName();
  }

  @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {

    RoleName active = user.getActiveRole();
    boolean stillValid = active != null && user.getRoles()
            .stream()
            .anyMatch(role -> role.getRoleName() == active);

    if (stillValid) {
      return List.of(new SimpleGrantedAuthority(active.name()));
    }

    return user.getRoles()
            .stream()
            .map(role ->
                    new SimpleGrantedAuthority(role.getRoleName().name())
            )
            .toList();
  }
  @Override
  public String getPassword() {
    return user.getPasswordHash();
  }

  @Override
  public @NullMarked String getUsername() {
    return user.getEmail();
  }

  @Override
  public boolean isEnabled() {
    return Boolean.TRUE.equals(user.getIsActive())
            && !Boolean.TRUE.equals(user.getIsDeleted());
  }
}