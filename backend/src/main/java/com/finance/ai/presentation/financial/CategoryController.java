package com.finance.ai.presentation.financial;

import com.finance.ai.application.financial.CreateCategoryUseCase;
import com.finance.ai.application.financial.ListCategoriesUseCase;
import com.finance.ai.domain.financial.Category;
import com.finance.ai.infrastructure.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categories")
@Tag(name = "Categorias", description = "Gerenciamento de categorias financeiras")
@SecurityRequirement(name = "bearerAuth")
public class CategoryController {

    private final CreateCategoryUseCase createCategoryUseCase;
    private final ListCategoriesUseCase listCategoriesUseCase;

    public CategoryController(CreateCategoryUseCase createCategoryUseCase,
                              ListCategoriesUseCase listCategoriesUseCase) {
        this.createCategoryUseCase = createCategoryUseCase;
        this.listCategoriesUseCase = listCategoriesUseCase;
    }

    @PostMapping
    @Operation(summary = "Cria uma nova categoria para o usuário autenticado")
    @org.springframework.cache.annotation.CacheEvict(value = "userCategories", key = "#user.userId()")
    public ResponseEntity<CategoryResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateCategoryRequest request) {

        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var category = createCategoryUseCase.execute(
                user.userId(),
                request.name(),
                request.icon(),
                request.colorHex()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(category));
    }

    @GetMapping
    @Operation(summary = "Lista todas as categorias do usuário e padrões de sistema")
    @org.springframework.cache.annotation.Cacheable(value = "userCategories", key = "#user.userId()")
    public ResponseEntity<List<CategoryResponse>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        var categories = listCategoriesUseCase.execute(user.userId());
        var response = categories.stream().map(this::toResponse).toList();
        return ResponseEntity.ok(response);
    }

    private CategoryResponse toResponse(Category c) {
        return new CategoryResponse(
                c.getId().toString(),
                c.getName(),
                c.getIcon(),
                c.getColorHex(),
                c.isSystemDefault(),
                c.getCreatedAt().toString()
        );
    }

    public record CreateCategoryRequest(
            @NotBlank @jakarta.validation.constraints.Size(min = 1, max = 50, message = "O nome da categoria deve ter no máximo 50 caracteres.") String name,
            @jakarta.validation.constraints.Size(max = 30, message = "O identificador do ícone deve ter no máximo 30 caracteres.") String icon,
            @jakarta.validation.constraints.Size(max = 7, message = "O código hexadecimal da cor deve ter no máximo 7 caracteres.") String colorHex
    ) {}

    public record CategoryResponse(
            String id,
            String name,
            String icon,
            String colorHex,
            boolean systemDefault,
            String createdAt
    ) {}
}
