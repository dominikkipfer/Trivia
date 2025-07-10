# Tremola-Development: virtual backend for the Chrome Browser

### Rationale
instead of writing JS and HTML code for your app, compile
in Android and then test it, this "tremola4chrome" environment enables
you to run it inside a Chrome brower tab.

Using Chrome's broadcast feature between tabs, new log entries are
sent to all tabs where they are funneled to your JS app logic. See the
attached PDFs for details in "/docs" (parts in German).

### MiniApp Instructions for Chrome Browser
In order to make use of the chrome environment when developing miniApps, you should start chrome with the *--allow-file-access-from-files* flag. On windows, this can be done by simultaneously pressing Windows + R and then inputting:<br> *chrome.exe --allow-file-access-from-files*

For an overview of the structure of a miniApp, consult the *miniApps.md* file in the */doc* folder