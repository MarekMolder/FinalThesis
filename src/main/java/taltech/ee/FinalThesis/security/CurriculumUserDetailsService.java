package taltech.ee.FinalThesis.security;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import taltech.ee.FinalThesis.domain.entities.User;
import taltech.ee.FinalThesis.repositories.UserRepository;

@RequiredArgsConstructor
public class CurriculumUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));
        return new CurriculumUserDetails(user);
    }
}
