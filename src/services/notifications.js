export class NotificationService {
  constructor() {
    this.permission = 'default'
    this.init()
  }

  async init() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission()
    }
  }

  async requestPermission() {
    if ('Notification' in window) {
      this.permission = await Notification.requestPermission()
      return this.permission === 'granted'
    }
    return false
  }

  showNotification(title, options = {}) {
    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        ...options
      })

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    }
  }

  showExpirationWarning(item, daysUntilExpiration) {
    const title = 'Przedmiot wygasa wkrótce!'
    const body = `${item.name} wygasa za ${daysUntilExpiration} dni (${this.formatDate(item.expirationDate)})`

    return this.showNotification(title, {
      body,
      tag: `expiration-${item.id}`,
      icon: '/icons/icon-192x192.png',
      requireInteraction: true
    })
  }

  showItemAddedNotification(item, userName) {
    const title = 'Dodano nowy przedmiot'
    const body = `${userName} dodał: ${item.name} (${item.quantity} ${item.unit})`

    return this.showNotification(title, {
      body,
      tag: `item-added-${item.id}`,
      icon: '/icons/icon-192x192.png'
    })
  }

  showItemUsedNotification(item, userName, quantity) {
    const title = 'Użyto przedmiot'
    const body = `${userName} użył: ${item.name} (${quantity} ${item.unit})`

    return this.showNotification(title, {
      body,
      tag: `item-used-${item.id}`,
      icon: '/icons/icon-192x192.png'
    })
  }

  formatDate(date) {
    if (!date) return ''
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString('pl-PL')
  }

  // Check for expiring items and show notifications
  checkExpiringItems(inventory, notificationDays = 30) {
    if (!inventory || inventory.length === 0) return

    const warningDate = new Date()
    warningDate.setDate(warningDate.getDate() + notificationDays)

    inventory.forEach(item => {
      if (item.status === 'used' || item.status === 'expired') return
      if (!item.expirationDate) return

      const expDate = item.expirationDate.toDate ? item.expirationDate.toDate() : new Date(item.expirationDate)
      const today = new Date()

      if (expDate <= warningDate && expDate >= today) {
        const daysUntil = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24))
        this.showExpirationWarning(item, daysUntil)
      }
    })
  }
}

// Create singleton instance
export const notificationService = new NotificationService()