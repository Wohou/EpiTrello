import nodemailer from 'nodemailer'
import { createClient } from '@supabase/supabase-js'

// Gmail SMTP - simple à configurer
const transporter = process.env.GMAIL_USER ? nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
}) : null

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}

export type NotificationType = 'card_assigned' | 'comment_added' | 'card_moved' | 'board_invitation' | 'comment_mention'

interface EmailData {
    type: NotificationType
    cardId?: string
    cardTitle?: string
    boardId: string
    boardTitle: string
    actorUsername: string
    commentContent?: string
    fromListTitle?: string
    toListTitle?: string
}

interface UserInfo {
    id: string
    email: string
    username: string
}

function getEmailTemplate(data: EmailData, recipientUsername: string): { subject: string; html: string } {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const cardUrl = data.cardId ? `${appUrl}/boards/${data.boardId}?card=${data.cardId}` : `${appUrl}/boards`
    const boardUrl = `${appUrl}/boards`

    const baseStyles = `
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef; }
      .footer { background: #343a40; color: #adb5bd; padding: 15px; border-radius: 0 0 8px 8px; font-size: 12px; text-align: center; }
      .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
      .card-title { background: white; padding: 15px; border-radius: 6px; border-left: 4px solid #667eea; margin: 15px 0; }
      .comment-box { background: white; padding: 15px; border-radius: 6px; border: 1px solid #dee2e6; margin: 15px 0; font-style: italic; }
      .highlight { color: #667eea; font-weight: bold; }
    </style>
  `

    const templates = {
        card_assigned: {
            subject: `📋 ${data.actorUsername} vous a assigné à "${data.cardTitle}"`,
            html: `
        <!DOCTYPE html><html><head>${baseStyles}</head><body>
          <div class="container">
            <div class="header"><h1 style="margin: 0;">📋 Nouvelle assignation</h1></div>
            <div class="content">
              <p>Bonjour <strong>${recipientUsername}</strong>,</p>
              <p><span class="highlight">${data.actorUsername}</span> vous a assigné à une carte sur le board <strong>${data.boardTitle}</strong>.</p>
              <div class="card-title"><strong>🎯 ${data.cardTitle}</strong></div>
              <a href="${cardUrl}" class="button">Voir la carte</a>
            </div>
            <div class="footer"><p>EpiTrello</p></div>
          </div>
        </body></html>
      `
        },
        comment_added: {
            subject: `💬 ${data.actorUsername} a commenté "${data.cardTitle}"`,
            html: `
        <!DOCTYPE html><html><head>${baseStyles}</head><body>
          <div class="container">
            <div class="header"><h1 style="margin: 0;">💬 Nouveau commentaire</h1></div>
            <div class="content">
              <p>Bonjour <strong>${recipientUsername}</strong>,</p>
              <p><span class="highlight">${data.actorUsername}</span> a commenté la carte <strong>${data.cardTitle}</strong>.</p>
              <div class="comment-box">"${data.commentContent || ''}"</div>
              <a href="${cardUrl}" class="button">Voir le commentaire</a>
            </div>
            <div class="footer"><p>EpiTrello</p></div>
          </div>
        </body></html>
      `
        },
        card_moved: {
            subject: `🔄 ${data.actorUsername} a déplacé "${data.cardTitle}"`,
            html: `
        <!DOCTYPE html><html><head>${baseStyles}</head><body>
          <div class="container">
            <div class="header"><h1 style="margin: 0;">🔄 Carte déplacée</h1></div>
            <div class="content">
              <p>Bonjour <strong>${recipientUsername}</strong>,</p>
              <p><span class="highlight">${data.actorUsername}</span> a déplacé une carte.</p>
              <div class="card-title"><strong>🎯 ${data.cardTitle}</strong></div>
              <p>📍 <strong>${data.fromListTitle}</strong> → <strong>${data.toListTitle}</strong></p>
              <a href="${cardUrl}" class="button">Voir la carte</a>
            </div>
            <div class="footer"><p>EpiTrello</p></div>
          </div>
        </body></html>
      `
        },
        board_invitation: {
            subject: `📨 ${data.actorUsername} vous invite à rejoindre "${data.boardTitle}"`,
            html: `
        <!DOCTYPE html><html><head>${baseStyles}</head><body>
          <div class="container">
            <div class="header"><h1 style="margin: 0;">📨 Invitation à collaborer</h1></div>
            <div class="content">
              <p>Bonjour <strong>${recipientUsername}</strong>,</p>
              <p><span class="highlight">${data.actorUsername}</span> vous invite à rejoindre le board <strong>${data.boardTitle}</strong>.</p>
              <p>Connectez-vous à EpiTrello pour accepter ou refuser cette invitation.</p>
              <a href="${boardUrl}" class="button">Voir mes invitations</a>
            </div>
            <div class="footer"><p>EpiTrello</p></div>
          </div>
        </body></html>
      `
        },
        comment_mention: {
            subject: `💬 ${data.actorUsername} vous a mentionné dans "${data.cardTitle}"`,
            html: `
        <!DOCTYPE html><html><head>${baseStyles}</head><body>
          <div class="container">
            <div class="header"><h1 style="margin: 0;">💬 Vous avez été mentionné</h1></div>
            <div class="content">
              <p>Bonjour <strong>${recipientUsername}</strong>,</p>
              <p><span class="highlight">${data.actorUsername}</span> vous a mentionné dans un commentaire sur la carte <strong>${data.cardTitle}</strong>.</p>
              <div class="comment-box">"${data.commentContent || ''}"</div>
              <a href="${cardUrl}" class="button">Voir le commentaire</a>
            </div>
            <div class="footer"><p>EpiTrello</p></div>
          </div>
        </body></html>
      `
        }
    }

    return templates[data.type] || { subject: 'EpiTrello - Notification', html: '<p>Nouvelle notification</p>' }
}

async function getCardInfo(cardId: string) {
    const supabase = getSupabaseAdmin()

    const { data: card } = await supabase.from('cards').select('id, title, list_id').eq('id', cardId).single()
    if (!card) return null

    const { data: list } = await supabase.from('lists').select('id, title, board_id').eq('id', card.list_id).single()
    if (!list) return null

    const { data: board } = await supabase.from('boards').select('id, title').eq('id', list.board_id).single()
    if (!board) return null

    return { id: card.id, title: card.title, list_id: list.id, list_title: list.title, board_id: board.id, board_title: board.title }
}

async function getListTitle(listId: string): Promise<string> {
    const { data } = await getSupabaseAdmin().from('lists').select('title').eq('id', listId).single()
    return data?.title || 'Unknown'
}

async function getUserInfo(userId: string): Promise<UserInfo | null> {
    const supabase = getSupabaseAdmin()

    const { data: profile } = await supabase.from('profiles').select('id, username').eq('id', userId).single()
    if (!profile) return null

    const { data: { user } } = await supabase.auth.admin.getUserById(userId)
    if (!user?.email) return null

    return { id: profile.id, email: user.email, username: profile.username || 'Utilisateur' }
}

async function getCardAssignees(cardId: string): Promise<UserInfo[]> {
    const { data: assignments } = await getSupabaseAdmin().from('card_assignments').select('user_id').eq('card_id', cardId)
    if (!assignments?.length) return []

    const users: UserInfo[] = []
    for (const a of assignments) {
        const info = await getUserInfo(a.user_id)
        if (info) users.push(info)
    }
    return users
}

async function getBoardMembers(boardId: string): Promise<UserInfo[]> {
    const supabase = getSupabaseAdmin()
    const { data: board } = await supabase.from('boards').select('owner_id').eq('id', boardId).single()
    const { data: members } = await supabase.from('board_members').select('user_id').eq('board_id', boardId)

    const userIds = new Set<string>()
    if (board?.owner_id) userIds.add(board.owner_id)
    members?.forEach(m => userIds.add(m.user_id))

    const users: UserInfo[] = []
    for (const id of userIds) {
        const info = await getUserInfo(id)
        if (info) users.push(info)
    }
    return users
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    if (!transporter) {
        console.log('[Email] Gmail not configured, skipping:', to, '-', subject)
        return false
    }

    try {
        await transporter.sendMail({
            from: `"EpiTrello" <${process.env.GMAIL_USER}>`,
            to,
            subject,
            html,
        })
        console.log('[Email] Sent to:', to)
        return true
    } catch (error) {
        console.error('[Email] Failed:', error)
        return false
    }
}

export async function notifyCardAssignment(cardId: string, assignedUserId: string, assignedByUserId: string) {
    try {
        if (assignedUserId === assignedByUserId) return

        const cardInfo = await getCardInfo(cardId)
        const assignedUser = await getUserInfo(assignedUserId)
        const assignedBy = await getUserInfo(assignedByUserId)
        if (!cardInfo || !assignedUser || !assignedBy) return

        const template = getEmailTemplate({
            type: 'card_assigned',
            cardId: cardInfo.id,
            cardTitle: cardInfo.title,
            boardId: cardInfo.board_id,
            boardTitle: cardInfo.board_title,
            actorUsername: assignedBy.username,
        }, assignedUser.username)

        await sendEmail(assignedUser.email, template.subject, template.html)
    } catch (error) {
        console.error('[Email] notifyCardAssignment error:', error)
    }
}

// Notifie les assignés de la carte, sinon tous les membres du board
// excludeUserIds permet d'exclure des users (ex: ceux déjà notifiés par mention)
export async function notifyCommentAdded(cardId: string, commentContent: string, commentAuthorId: string, excludeUserIds: string[] = []) {
    try {
        const cardInfo = await getCardInfo(cardId)
        const author = await getUserInfo(commentAuthorId)
        if (!cardInfo || !author) return

        let recipients = await getCardAssignees(cardId)
        if (!recipients.length) recipients = await getBoardMembers(cardInfo.board_id)
        recipients = recipients.filter(r => r.id !== commentAuthorId && !excludeUserIds.includes(r.id))
        if (!recipients.length) return

        const emailData: EmailData = {
            type: 'comment_added',
            cardId: cardInfo.id,
            cardTitle: cardInfo.title,
            boardId: cardInfo.board_id,
            boardTitle: cardInfo.board_title,
            actorUsername: author.username,
            commentContent: commentContent.length > 200 ? commentContent.substring(0, 200) + '...' : commentContent,
        }

        for (const r of recipients) {
            const template = getEmailTemplate(emailData, r.username)
            await sendEmail(r.email, template.subject, template.html)
        }
    } catch (error) {
        console.error('[Email] notifyCommentAdded error:', error)
    }
}

// Notifie uniquement les assignés de la carte
export async function notifyCardMoved(cardId: string, fromListId: string, toListId: string, movedByUserId: string) {
    try {
        if (fromListId === toListId) return

        const cardInfo = await getCardInfo(cardId)
        const movedBy = await getUserInfo(movedByUserId)
        if (!cardInfo || !movedBy) return

        const recipients = (await getCardAssignees(cardId)).filter(r => r.id !== movedByUserId)
        if (!recipients.length) return

        const emailData: EmailData = {
            type: 'card_moved',
            cardId: cardInfo.id,
            cardTitle: cardInfo.title,
            boardId: cardInfo.board_id,
            boardTitle: cardInfo.board_title,
            actorUsername: movedBy.username,
            fromListTitle: await getListTitle(fromListId),
            toListTitle: await getListTitle(toListId),
        }

        for (const r of recipients) {
            const template = getEmailTemplate(emailData, r.username)
            await sendEmail(r.email, template.subject, template.html)
        }
    } catch (error) {
        console.error('[Email] notifyCardMoved error:', error)
    }
}

// Notifie l'utilisateur invité à rejoindre un board
export async function notifyBoardInvitation(boardId: string, inviteeId: string, inviterId: string) {
    try {
        if (inviteeId === inviterId) return

        const supabase = getSupabaseAdmin()

        // Get board info
        const { data: board } = await supabase.from('boards').select('id, title').eq('id', boardId).single()
        if (!board) return

        const invitee = await getUserInfo(inviteeId)
        const inviter = await getUserInfo(inviterId)
        if (!invitee || !inviter) return

        const template = getEmailTemplate({
            type: 'board_invitation',
            boardId: board.id,
            boardTitle: board.title,
            actorUsername: inviter.username,
        }, invitee.username)

        await sendEmail(invitee.email, template.subject, template.html)
    } catch (error) {
        console.error('[Email] notifyBoardInvitation error:', error)
    }
}

// Notifie les utilisateurs mentionnés dans un commentaire
export async function notifyCommentMention(cardId: string, commentContent: string, mentionedUserIds: string[], mentionAuthorId: string) {
    try {
        const cardInfo = await getCardInfo(cardId)
        const author = await getUserInfo(mentionAuthorId)
        if (!cardInfo || !author) return

        const recipients: UserInfo[] = []
        for (const userId of mentionedUserIds) {
            if (userId === mentionAuthorId) continue // Don't notify self-mention
            const user = await getUserInfo(userId)
            if (user) recipients.push(user)
        }
        if (!recipients.length) return

        const emailData: EmailData = {
            type: 'comment_mention',
            cardId: cardInfo.id,
            cardTitle: cardInfo.title,
            boardId: cardInfo.board_id,
            boardTitle: cardInfo.board_title,
            actorUsername: author.username,
            commentContent: commentContent.length > 200 ? commentContent.substring(0, 200) + '...' : commentContent,
        }

        for (const r of recipients) {
            const template = getEmailTemplate(emailData, r.username)
            await sendEmail(r.email, template.subject, template.html)
        }
    } catch (error) {
        console.error('[Email] notifyCommentMention error:', error)
    }
}

// Helper pour extraire les userIds mentionnés dans un commentaire
export async function extractMentionedUserIds(content: string, boardId: string): Promise<string[]> {
    // Extract @username patterns from content
    const mentionRegex = /@(\w+)/g
    const usernames: string[] = []
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
        usernames.push(match[1])
    }
    if (!usernames.length) return []

    // Get board members to find matching userIds
    const supabase = getSupabaseAdmin()
    const { data: board } = await supabase.from('boards').select('owner_id').eq('id', boardId).single()
    const { data: members } = await supabase.from('board_members').select('user_id').eq('board_id', boardId)

    const userIds = new Set<string>()
    if (board?.owner_id) userIds.add(board.owner_id)
    members?.forEach(m => userIds.add(m.user_id))

    // Find profiles matching usernames
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username')
        .in('id', Array.from(userIds))

    const mentionedIds: string[] = []
    for (const profile of profiles || []) {
        if (profile.username && usernames.includes(profile.username)) {
            mentionedIds.push(profile.id)
        }
    }

    return mentionedIds
}
