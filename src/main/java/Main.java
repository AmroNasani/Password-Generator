import java.util.ArrayList;
import java.util.Random;
public class Main {
    static int MIN = 33; //first printable char in ASCII
    static int MAX = 126; //last printable char in ASCII
    static Random random = new Random();

    private static ArrayList<Integer> create(int eingabe) {
        int asciiDigit;
        ArrayList<Integer> array = new ArrayList<>();
        for (int i = 0; i < eingabe; i++) {
            asciiDigit = random.nextInt((MAX - MIN + 1)) + MIN;
            array.add(asciiDigit);
        }
        return array;
    }
    // for future : add multiple password to the output

    public static void main(String[] args) {
        if (args.length == 0)
            System.out.println("enter the long of key");
        int eingabe = Integer.parseInt(args[0]);
        ArrayList<Integer> array = create(eingabe);
        for (int a : array)
            System.out.print((char) a);

    }
}