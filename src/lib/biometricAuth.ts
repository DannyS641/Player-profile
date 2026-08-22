import { Capacitor } from "@capacitor/core";
import { BiometricAuth, BiometryType } from "@aparajita/capacitor-biometric-auth";

export type BiometryAvailability = {
  isAvailable: boolean;
  label: string;
};

const labelFor = (type: BiometryType): string => {
  switch (type) {
    case BiometryType.faceId:
      return "Face ID";
    case BiometryType.touchId:
      return "Touch ID";
    case BiometryType.fingerprintAuthentication:
      return "fingerprint";
    case BiometryType.faceAuthentication:
      return "face unlock";
    case BiometryType.irisAuthentication:
      return "iris unlock";
    default:
      return "biometrics";
  }
};

export async function getBiometryAvailability(): Promise<BiometryAvailability> {
  if (!Capacitor.isNativePlatform()) {
    return { isAvailable: false, label: "biometrics" };
  }
  try {
    const result = await BiometricAuth.checkBiometry();
    return {
      isAvailable: result.isAvailable,
      label: labelFor(result.biometryType),
    };
  } catch {
    return { isAvailable: false, label: "biometrics" };
  }
}

export async function authenticateWithBiometrics(
  reason = "Log in to your account",
): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await BiometricAuth.authenticate({ reason, allowDeviceCredential: false });
    return true;
  } catch {
    return false;
  }
}
