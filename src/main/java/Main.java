import java.security.SecureRandom;

public class Main {
    private static final SecureRandom RANDOM = new SecureRandom();

    static String create(int length) {
        if (length < 8 || length > 128) {
            throw new IllegalArgumentException("Die Länge muss zwischen 8 und 128 liegen.");
        }
        StringBuilder password = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            password.append((char) (RANDOM.nextInt(94) + 33));
        }
        return password.toString();
    }

    public static void main(String[] args) {
        if (args.length != 1) {
            System.err.println("Aufruf: Main <Länge zwischen 8 und 128>");
            System.exit(1);
            return;
        }
        try {
            System.out.println(create(Integer.parseInt(args[0])));
        } catch (IllegalArgumentException exception) {
            System.err.println("Bitte eine ganze Zahl zwischen 8 und 128 angeben.");
            System.exit(1);
        }
    }
}
