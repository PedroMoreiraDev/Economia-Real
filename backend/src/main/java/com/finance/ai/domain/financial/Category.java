package com.finance.ai.domain.financial;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

/**
 * Entidade de domínio que categoriza transações.
 */
public class Category {

    private final UUID id;
    private final UUID userId;
    private final UUID parentId;
    private final String name;
    private final String icon;
    private final String colorHex;
    private final boolean systemDefault;
    private final Instant createdAt;
    private Instant updatedAt;

    public Category(UUID id, UUID userId, UUID parentId, String name, String icon,
                    String colorHex, boolean systemDefault, Instant createdAt, Instant updatedAt) {
        this.id = Objects.requireNonNull(id, "ID da categoria é obrigatório.");
        this.userId = Objects.requireNonNull(userId, "ID do usuário é obrigatório.");
        this.parentId = parentId;
        this.name = validateName(name);
        this.icon = icon;
        this.colorHex = colorHex;
        this.systemDefault = systemDefault;
        this.createdAt = Objects.requireNonNull(createdAt, "Data de criação é obrigatória.");
        this.updatedAt = updatedAt != null ? updatedAt : createdAt;
    }

    public static Category create(UUID userId, String name, String icon, String colorHex) {
        var now = Instant.now();
        return new Category(UUID.randomUUID(), userId, null, name, icon, colorHex, false, now, now);
    }

    public static Category createSystemDefault(UUID userId, String name, String icon, String colorHex) {
        var now = Instant.now();
        return new Category(UUID.randomUUID(), userId, null, name, icon, colorHex, true, now, now);
    }

    private static String validateName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Nome da categoria não pode ser vazio.");
        }
        return name.trim();
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public UUID getParentId() { return parentId; }
    public String getName() { return name; }
    public String getIcon() { return icon; }
    public String getColorHex() { return colorHex; }
    public boolean isSystemDefault() { return systemDefault; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
}
