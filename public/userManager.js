class UserManager {
  static getUserId() {
    let userId = localStorage.getItem("demoUserId");
    if (!userId) {
      userId = `user_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem("demoUserId", userId);
    }
    return userId;
  }

  static getUserName() {
    return (
      localStorage.getItem("demoUserName") ||
      `Usuario ${this.getUserId().substring(5)}`
    );
  }

  static setUserName(name) {
    localStorage.setItem("demoUserName", name);
  }
}

// signatureTracker.js
class SignatureTracker {
  static documentWasSignedByUser(documentId) {
    const signatures = JSON.parse(localStorage.getItem('documentSignatures') || {});
    return !!signatures[documentId];
  }

  static recordSignature(documentId, signatureData) {
    const signatures = JSON.parse(localStorage.getItem('documentSignatures') || '{}');
    signatures[documentId] = {
      timestamp: new Date().toISOString(),
      userId: UserManager.getUserId(),
      userName: UserManager.getUserName(),
      ...signatureData
    };
    localStorage.setItem('documentSignatures', JSON.stringify(signatures));
  }

  static getUserSignatures() {
    return JSON.parse(localStorage.getItem('documentSignatures') || '{}');
  }
}