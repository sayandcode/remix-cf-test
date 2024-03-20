const { APP_CUSTOM_DOMAIN, APP_CUSTOM_DOMAIN_CERT_ARN } = process.env;
const envVars = { APP_CUSTOM_DOMAIN, APP_CUSTOM_DOMAIN_CERT_ARN };

type EnvVars = typeof envVars;
export default function getEnvVars(){
  if (!getIsEnvSetCorrectly(envVars)) throw new Error("Please set the env variables correctly");
  return envVars;
}

type CorrectlySetEnv = {
  [k in keyof typeof envVars]: NonNullable<typeof envVars[k]>
}

function getIsEnvSetCorrectly(envVars: EnvVars): envVars is CorrectlySetEnv{
  return [APP_CUSTOM_DOMAIN, APP_CUSTOM_DOMAIN_CERT_ARN].every(val => typeof val === 'string' && val != '');
}