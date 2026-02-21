import { translations, type Language, type TranslationKey } from '../lib/translations'

describe('translations', () => {
  it('should export translations object', () => {
    expect(translations).toBeDefined()
    expect(typeof translations).toBe('object')
  })

  it('should have fr and en languages', () => {
    expect(translations.fr).toBeDefined()
    expect(translations.en).toBeDefined()
  })

  it('should have Language type for fr and en', () => {
    const fr: Language = 'fr'
    const en: Language = 'en'
    expect(fr).toBe('fr')
    expect(en).toBe('en')
  })

  describe('French translations', () => {
    const fr = translations.fr

    it('should have common section', () => {
      expect(fr.common).toBeDefined()
      expect(fr.common.loading).toBe('Chargement...')
      expect(fr.common.save).toBe('Enregistrer')
      expect(fr.common.cancel).toBe('Annuler')
      expect(fr.common.delete).toBe('Supprimer')
      expect(fr.common.edit).toBe('Modifier')
      expect(fr.common.create).toBe('Créer')
      expect(fr.common.add).toBe('Ajouter')
      expect(fr.common.back).toBe('Retour')
      expect(fr.common.close).toBe('Fermer')
      expect(fr.common.search).toBe('Rechercher')
      expect(fr.common.settings).toBe('Paramètres')
      expect(fr.common.logout).toBe('Déconnexion')
      expect(fr.common.profile).toBe('Profil')
    })

    it('should have auth section', () => {
      expect(fr.auth).toBeDefined()
      expect(fr.auth.signIn).toBe('Connexion')
      expect(fr.auth.signUp).toBe('Inscription')
      expect(fr.auth.email).toBe('Email')
      expect(fr.auth.password).toBe('Mot de passe')
      expect(fr.auth.username).toBe("Nom d'utilisateur")
      expect(fr.auth.forgotPassword).toBe('Mot de passe oublié ?')
      expect(fr.auth.or).toBe('OU')
    })

    it('should have boards section', () => {
      expect(fr.boards).toBeDefined()
      expect(fr.boards.myBoards).toBeDefined()
      expect(fr.boards.createBoard).toBeDefined()
      expect(fr.boards.deleteBoard).toBeDefined()
    })

    it('should have lists section', () => {
      expect(fr.lists).toBeDefined()
      expect(fr.lists.addAnotherList).toBeDefined()
    })

    it('should have cards section', () => {
      expect(fr.cards).toBeDefined()
      expect(fr.cards.addCard).toBeDefined()
    })

    it('should have sharing section', () => {
      expect(fr.sharing).toBeDefined()
      expect(fr.sharing.inviteUser).toBeDefined()
    })

    it('should have settings section', () => {
      expect(fr.settings).toBeDefined()
    })

    it('should have guide section', () => {
      expect(fr.guide).toBeDefined()
      expect(fr.guide.title).toBeDefined()
    })
  })

  describe('English translations', () => {
    const en = translations.en

    it('should have common section', () => {
      expect(en.common).toBeDefined()
      expect(en.common.loading).toBe('Loading...')
      expect(en.common.save).toBe('Save')
      expect(en.common.cancel).toBe('Cancel')
      expect(en.common.delete).toBe('Delete')
      expect(en.common.edit).toBe('Edit')
      expect(en.common.create).toBe('Create')
      expect(en.common.add).toBe('Add')
      expect(en.common.back).toBe('Back')
      expect(en.common.close).toBe('Close')
      expect(en.common.search).toBe('Search')
      expect(en.common.settings).toBe('Settings')
      expect(en.common.logout).toBe('Logout')
      expect(en.common.profile).toBe('Profile')
    })

    it('should have auth section', () => {
      expect(en.auth).toBeDefined()
      expect(en.auth.signIn).toBe('Sign In')
      expect(en.auth.signUp).toBe('Sign Up')
      expect(en.auth.email).toBe('Email')
      expect(en.auth.password).toBe('Password')
    })

    it('should have boards section', () => {
      expect(en.boards).toBeDefined()
      expect(en.boards.myBoards).toBeDefined()
    })

    it('should have lists section', () => {
      expect(en.lists).toBeDefined()
    })

    it('should have cards section', () => {
      expect(en.cards).toBeDefined()
    })

    it('should have sharing section', () => {
      expect(en.sharing).toBeDefined()
    })

    it('should have settings section', () => {
      expect(en.settings).toBeDefined()
    })

    it('should have guide section', () => {
      expect(en.guide).toBeDefined()
      expect(en.guide.title).toBeDefined()
    })
  })

  describe('Translation structure parity', () => {
    it('should have the same top-level keys in fr and en', () => {
      const frKeys = Object.keys(translations.fr).sort()
      const enKeys = Object.keys(translations.en).sort()
      expect(frKeys).toEqual(enKeys)
    })

    it('should have matching keys in common section', () => {
      const frKeys = Object.keys(translations.fr.common).sort()
      const enKeys = Object.keys(translations.en.common).sort()
      expect(frKeys).toEqual(enKeys)
    })

    it('should have matching keys in auth section', () => {
      const frKeys = Object.keys(translations.fr.auth).sort()
      const enKeys = Object.keys(translations.en.auth).sort()
      expect(frKeys).toEqual(enKeys)
    })

    it('should have matching keys in boards section', () => {
      const frKeys = Object.keys(translations.fr.boards).sort()
      const enKeys = Object.keys(translations.en.boards).sort()
      expect(frKeys).toEqual(enKeys)
    })

    it('should have matching keys in cards section', () => {
      const frKeys = Object.keys(translations.fr.cards).sort()
      const enKeys = Object.keys(translations.en.cards).sort()
      expect(frKeys).toEqual(enKeys)
    })

    it('should have matching keys in guide section', () => {
      const frKeys = Object.keys(translations.fr.guide).sort()
      const enKeys = Object.keys(translations.en.guide).sort()
      expect(frKeys).toEqual(enKeys)
    })

    it('should be assignable to TranslationKey type', () => {
      const key: TranslationKey = translations.fr
      expect(key).toBeDefined()
    })

    it('should not have empty string values in fr', () => {
      const checkEmpty = (obj: Record<string, unknown>, path: string) => {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            expect(value.length).toBeGreaterThan(0)
          } else if (typeof value === 'object' && value !== null) {
            checkEmpty(value as Record<string, unknown>, `${path}.${key}`)
          }
        }
      }
      checkEmpty(translations.fr as unknown as Record<string, unknown>, 'fr')
    })

    it('should not have empty string values in en', () => {
      const checkEmpty = (obj: Record<string, unknown>, path: string) => {
        for (const [key, value] of Object.entries(obj)) {
          if (typeof value === 'string') {
            expect(value.length).toBeGreaterThan(0)
          } else if (typeof value === 'object' && value !== null) {
            checkEmpty(value as Record<string, unknown>, `${path}.${key}`)
          }
        }
      }
      checkEmpty(translations.en as unknown as Record<string, unknown>, 'en')
    })
  })
})
