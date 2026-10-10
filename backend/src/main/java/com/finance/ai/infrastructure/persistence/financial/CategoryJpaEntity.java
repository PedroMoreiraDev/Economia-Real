package com.finance.ai.infrastructure.persistence.financial;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "categories")
public class CategoryJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "icon", length = 50)
    private String icon;

    @Column(name = "color_hex", length = 7)
    private String colorHex;

    @Column(name = "is_system_default", nullable = false)
    private boolean systemDefault;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CategoryJpaEntity() {}

    public CategoryJpaEntity(UUID id, UUID userId, UUID parentId, String name, String icon,
                             String colorHex, boolean systemDefault, Instant createdAt, Instant updatedAt) {
        this.id = id;
        this.userId = userId;
        this.parentId = parentId;
        this.name = name;
        this.icon = icon;
        this.colorHex = colorHex;
        this.systemDefault = systemDefault;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
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
