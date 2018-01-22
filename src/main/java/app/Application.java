package app;

import app.util.*;
import static spark.Spark.*;

public class Application {

    public static void main(String[] args) {
        port(8080);
        get("/", (req, res) -> "OK!");
    }

}
