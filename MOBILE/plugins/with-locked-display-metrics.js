const {
  createRunOncePlugin,
  withMainActivity,
  withMainApplication,
} = require("@expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");

const TAG = "autodaddy-lock-display-metrics";

const IMPORTS = [
  "import android.content.Context",
  "import android.content.res.Configuration",
  "import android.os.Build",
  "import android.util.DisplayMetrics",
];

const LOCK_METRICS_METHODS = `
  override fun attachBaseContext(newBase: Context) {
    val configuration = Configuration(newBase.resources.configuration)
    configuration.fontScale = 1.0f
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      configuration.densityDpi = DisplayMetrics.DENSITY_DEVICE_STABLE
    }
    val context = newBase.createConfigurationContext(configuration)
    super.attachBaseContext(context)
  }

  override fun onConfigurationChanged(newConfig: Configuration) {
    val configuration = Configuration(newConfig)
    configuration.fontScale = 1.0f
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      configuration.densityDpi = DisplayMetrics.DENSITY_DEVICE_STABLE
    }
    applyOverrideConfiguration(configuration)
    super.onConfigurationChanged(configuration)
  }
`;

const MAIN_APPLICATION_ON_CONFIG = `
  override fun onConfigurationChanged(newConfig: Configuration) {
    val configuration = Configuration(newConfig)
    configuration.fontScale = 1.0f
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      configuration.densityDpi = DisplayMetrics.DENSITY_DEVICE_STABLE
    }
    super.onConfigurationChanged(configuration)
    ApplicationLifecycleDispatcher.onConfigurationChanged(this, configuration)
  }
`;

const MAIN_APPLICATION_ON_CONFIG_TAGGED = `// @generated begin ${TAG}-application-on-config

${MAIN_APPLICATION_ON_CONFIG.trim()}

// @generated end ${TAG}-application-on-config
`;

function removeGeneratedBlock(contents, tag) {
  const pattern = new RegExp(
    `\\n?// @generated begin ${tag}[\\s\\S]*?// @generated end ${tag}\\n?`,
    "g"
  );
  return contents.replace(pattern, "\n");
}

function removeMainApplicationOnConfig(contents) {
  return contents.replace(
    /\n\s*override fun onConfigurationChanged\(newConfig: Configuration\) \{[\s\S]*?ApplicationLifecycleDispatcher\.onConfigurationChanged\(this,\s*(?:newConfig|configuration)\)\s*\n\s*\}\n?/g,
    "\n"
  );
}

function insertMainApplicationOnConfig(contents) {
  const onCreateBlockPattern =
    /(  override fun onCreate\(\) \{[\s\S]*?ApplicationLifecycleDispatcher\.onApplicationCreate\(this\)\n  \}\n)/;

  if (!onCreateBlockPattern.test(contents)) {
    throw new Error(
      "with-locked-display-metrics: Failed to locate onCreate block in MainApplication.kt"
    );
  }

  return contents.replace(
    onCreateBlockPattern,
    `$1\n${MAIN_APPLICATION_ON_CONFIG_TAGGED}`
  );
}

function addKotlinImports(contents) {
  let next = contents;
  for (const imp of IMPORTS) {
    if (!next.includes(imp)) {
      next = next.replace(/^(package .+\n)/m, `$1${imp}\n`);
    }
  }
  return next;
}

function withLockedDisplayMetrics(config) {
  config = withMainActivity(config, (config) => {
    let contents = config.modResults.contents;
    if (contents.includes(TAG)) {
      config.modResults.contents = contents;
      return config;
    }
    contents = addKotlinImports(contents);
    const merged = mergeContents({
      src: contents,
      newSrc: LOCK_METRICS_METHODS,
      tag: TAG,
      anchor: /class MainActivity : ReactActivity\(\) \{/,
      offset: 1,
      comment: "//",
    });
    if (!merged.didMerge) {
      throw new Error(
        "with-locked-display-metrics: Failed to inject into MainActivity.kt"
      );
    }
    config.modResults.contents = merged.contents;
    return config;
  });

  config = withMainApplication(config, (config) => {
    let contents = addKotlinImports(config.modResults.contents);
    if (!contents.includes(`${TAG}-application-attach`)) {
      const attachOnly = mergeContents({
        src: contents,
        newSrc: `
  override fun attachBaseContext(newBase: Context) {
    val configuration = Configuration(newBase.resources.configuration)
    configuration.fontScale = 1.0f
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
      configuration.densityDpi = DisplayMetrics.DENSITY_DEVICE_STABLE
    }
    val context = newBase.createConfigurationContext(configuration)
    super.attachBaseContext(context)
  }
`,
        tag: `${TAG}-application-attach`,
        anchor: /class MainApplication : Application\(\), ReactApplication \{/,
        offset: 1,
        comment: "//",
      });
      if (!attachOnly.didMerge) {
        throw new Error(
          "with-locked-display-metrics: Failed to inject attachBaseContext into MainApplication.kt"
        );
      }
      contents = attachOnly.contents;
    }

    contents = removeGeneratedBlock(contents, `${TAG}-application-on-config`);
    contents = removeMainApplicationOnConfig(contents);
    contents = insertMainApplicationOnConfig(contents);

    config.modResults.contents = contents;
    return config;
  });

  return config;
}

module.exports = createRunOncePlugin(
  withLockedDisplayMetrics,
  "with-locked-display-metrics",
  "1.0.2"
);
