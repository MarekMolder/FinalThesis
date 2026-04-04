package taltech.ee.FinalThesis.services;

import taltech.ee.FinalThesis.domain.dto.UserProfileResponse;

public interface UserService {
    UserProfileResponse getProfile(String email);
    UserProfileResponse updateName(String email, String name);
    void changePassword(String email, String currentPassword, String newPassword, String confirmPassword);
}
