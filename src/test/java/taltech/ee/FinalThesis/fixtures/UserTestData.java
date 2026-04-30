package taltech.ee.FinalThesis.fixtures;

import jakarta.persistence.EntityManager;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.domain.enums.UserRoleEnum;

import java.util.UUID;

public final class UserTestData {

    private UserTestData() {}

    public static Builder aUser() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private String name = "Test User";
        private String email = "user-" + UUID.randomUUID() + "@example.com";
        private String passwordHash = "$2a$10$abcdefghijklmnopqrstuv";
        private UserRoleEnum role = UserRoleEnum.TEACHER;

        public Builder withId(UUID id) {
            this.id = id;
            return this;
        }

        public Builder withName(String name) {
            this.name = name;
            return this;
        }

        public Builder withEmail(String email) {
            this.email = email;
            return this;
        }

        public Builder withPasswordHash(String passwordHash) {
            this.passwordHash = passwordHash;
            return this;
        }

        public Builder withRole(UserRoleEnum role) {
            this.role = role;
            return this;
        }

        public User build() {
            User u = new User();
            if (id != null) u.setId(id);
            u.setName(name);
            u.setEmail(email);
            u.setPasswordHash(passwordHash);
            u.setRole(role);
            return u;
        }

        public User buildAndSave(EntityManager em) {
            User u = build();
            em.persist(u);
            em.flush();
            return u;
        }
    }
}
