package com.example.back_end.service.admin;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.back_end.dto.response.CategoryOptionResponse;
import com.example.back_end.dto.response.admin.AdminCategoryResponse;
import com.example.back_end.dto.request.admin.AdminCategoryRequest;
import com.example.back_end.entity.Category;
import com.example.back_end.exception.BusinessException;
import com.example.back_end.exception.ResourceNotFoundException;
import com.example.back_end.repository.admin.AdminCategoryRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminCategoryService {

    private final AdminCategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<CategoryOptionResponse> getActiveCategories() {
        return categoryRepository.findAllActive().stream()
                .map(c -> new CategoryOptionResponse(c.getId(), c.getName()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<AdminCategoryResponse> getAllCategories() {
        return categoryRepository.findAllForAdmin().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminCategoryResponse getCategoryById(Long id) {
        return toResponse(categoryRepository.findByIdForAdmin(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id)));
    }

    @Transactional(readOnly = true)
    public List<AdminCategoryResponse> getCategoriesByParentId(Long parentId) {
        return categoryRepository.findChildrenByParentId(parentId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminCategoryResponse createCategory(AdminCategoryRequest request) {
        Category parent = resolveParent(request.parentId(), null);

        Category category = new Category();
        category.setName(request.name());
        category.setSlug(generateUniqueSlug(request.name()));
        category.setParent(parent);
        category.setIsDeleted(false);
        category.setCreatedAt(Instant.now());
        category.setUpdatedAt(Instant.now());

        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public AdminCategoryResponse updateCategory(Long id, AdminCategoryRequest request) {
        Category category = categoryRepository.findByIdForAdmin(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));

        if (request.parentId() != null && request.parentId().equals(id)) {
            throw new BusinessException("Category cannot be its own parent");
        }
        category.setParent(resolveParent(request.parentId(), id));

        String oldName = category.getName();
        category.setName(request.name());
        if (!oldName.equals(request.name())) {
            category.setSlug(generateUniqueSlugExcluding(request.name(), id));
        }

        if (request.isDeleted() != null) {
            category.setIsDeleted(request.isDeleted());
        }

        category.setUpdatedAt(Instant.now());
        return toResponse(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(Long id) {
        Category category = categoryRepository.findByIdForAdmin(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        category.setIsDeleted(true);
        category.setUpdatedAt(Instant.now());
        categoryRepository.save(category);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Category resolveParent(Long parentId, Long selfId) {
        if (parentId == null) return null;
        if (parentId.equals(selfId)) throw new BusinessException("Category cannot be its own parent");
        return categoryRepository.findActiveById(parentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent category not found: " + parentId));
    }

    private AdminCategoryResponse toResponse(Category c) {
        Long parentId = c.getParent() != null ? c.getParent().getId() : null;
        String parentName = c.getParent() != null ? c.getParent().getName() : null;
        return new AdminCategoryResponse(
                c.getId(), c.getName(), c.getSlug(),
                parentId, parentName,
                c.getIsDeleted(), c.getCreatedAt(), c.getUpdatedAt());
    }

    private String generateSlug(String name) {
        String pre = name.replace("đ", "d").replace("Đ", "D");
        return Normalizer.normalize(pre, Normalizer.Form.NFD)
                .replaceAll("[\\p{InCombiningDiacriticalMarks}]", "")
                .toLowerCase().trim()
                .replaceAll("\\s+", "-")
                .replaceAll("[^a-z0-9-]", "");
    }

    private String generateUniqueSlug(String name) {
        String base = generateSlug(name);
        String candidate = base;
        for (int i = 2; categoryRepository.countBySlug(candidate) > 0; i++) {
            candidate = base + "-" + i;
        }
        return candidate;
    }

    private String generateUniqueSlugExcluding(String name, Long excludeId) {
        String base = generateSlug(name);
        String candidate = base;
        for (int i = 2; categoryRepository.countBySlugAndNotId(candidate, excludeId) > 0; i++) {
            candidate = base + "-" + i;
        }
        return candidate;
    }
}
