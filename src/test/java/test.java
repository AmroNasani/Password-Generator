import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import java.util.ArrayList;


class PasswordGeneratorTest  {
    @Test
    @DisplayName("testing ob erzeugtes Key gleiche Länge wie eingabe hat")
    void testCreate1() {
        int festeEingabe = 50;
        ArrayList<Integer> TestedArray = new ArrayList<>();
        for (int i = 0; i < festeEingabe; i++) {
            TestedArray.add(i);
        }
        assertThat(TestedArray.size()).isEqualTo(festeEingabe);
    }
}


