import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordGeneratorTest {
    @Test
    void createsRequestedLengthWithPrintableCharacters() {
        for (int length : new int[] {8, 20, 50, 128}) {
            String password = Main.create(length);
            assertThat(password).hasSize(length);
            assertThat(password.chars().allMatch(value -> value >= 33 && value <= 126)).isTrue();
        }
    }
    @Test
    void rejectsInvalidLengths() {
        for (int length : new int[] {-1, 0, 7, 129}) {
            assertThatThrownBy(() -> Main.create(length)).isInstanceOf(IllegalArgumentException.class);
        }
    }
}
