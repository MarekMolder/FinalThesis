# Git push käsud (FinalThesis → GitHub)

Käivita need käsud **projekti kaustas** (`cd /Users/marekmolder/Desktop/FinalThesis/FinalThesis` või liigu sinna) **järjekorras**.

## 1. Initsialiseeri repo
```bash
git init
```

## 2. Lisa kõik failid (.gitignore välistab target/, .idea/ jms)
```bash
git add .
```

## 3. Esimene commit (JWT security, entityd, exception handler jms)
```bash
git commit -m "first commit: JWT auth, entities, exception handling"
```

## 4. Peaharud nimeks main
```bash
git branch -M main
```

## 5. Lisa GitHub remote (kord ühe repo kohta)
```bash
git remote add origin https://github.com/MarekMolder/FinalThesis.git
```

Kui `origin` on juba olemas ja tahad asendada:
```bash
git remote remove origin
git remote add origin https://github.com/MarekMolder/FinalThesis.git
```

## 6. Pushi main GitHubi
```bash
git push -u origin main
```

Git küsib vajadusel GitHubi kasutajanime ja parooli (või Personal Access Token). Kui kasutad 2FA, pead kasutama **Personal Access Token** parooli asemel.

---

**Ühe reana** (kopeeri-terminali):
```bash
cd /Users/marekmolder/Desktop/FinalThesis/FinalThesis && git init && git add . && git commit -m "first commit: JWT auth, entities, exception handling" && git branch -M main && git remote add origin https://github.com/MarekMolder/FinalThesis.git && git push -u origin main
```
