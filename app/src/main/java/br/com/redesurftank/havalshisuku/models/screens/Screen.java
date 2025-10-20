package br.com.redesurftank.havalshisuku.models.screens;

public interface Screen {
    public static enum Key {
        UP, DOWN, ENTER, BACK, BACK_LONG
    }

    String getJsName();

    void processKey(Key key);

    void initialize(Screen previousScreen);

    Screen getPreviousScreen();

}
