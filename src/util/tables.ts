import { TableSchema } from "../interfaces/tableschema";

export const tableSchemas: TableSchema[] = [
    // Util
    {
        name: 'scrapers',
        schema:[
            'module TEXT PRIMARY KEY',
            'scraped BOOLEAN'
        ]
    },

    // Forums
    {
        name: 'forums',
        schema: [
            'forum_id TEXT PRIMARY KEY',
            'title_welcome TEXT',
            'show_forum_viewers TEXT',
            'preset_id TEXT',
            'category_id TEXT',
            'category_name TEXT',
            'category_order TEXT',
            'collapsed TEXT',
            'forum_name TEXT',
            'forum_description TEXT',
            'view_access TEXT',
            'view_access_tag TEXT',
            'post_access TEXT',
            'post_access_tag TEXT',
            'moderation_access TEXT',
            'moderation_access_tag TEXT',
            'forum_order TEXT',
            'forum_threads TEXT',
            'forum_posts TEXT',
            'forum_lastthread_id TEXT',
            'poll_enabled TEXT',
            'email_notifications TEXT',
            'parent_id TEXT',
            'disable_signature TEXT',
            'disable_user_post_count TEXT',
            'disable_voting TEXT',
            'fb_like_enabled TEXT',
            'twitter_enabled TEXT',
            'disable_sharing_links TEXT',
            'remove_filters TEXT',
            'users_see_own_threads TEXT',
            'minimum_posts_to_post TEXT',
            'minimum_posts_to_view TEXT',
            'forum_type TEXT',
            'redirect_url TEXT',
            'redirect_type TEXT',
            'bottom_breadcrumbs TEXT',
            'unread_icon TEXT',
            'read_icon TEXT',
            'lock_own_threads TEXT',
            'users_see_own_edit TEXT',
            'character_game_rid TEXT',
            'character_game_serverid TEXT',
            'unlock_own_threads TEXT',
            'disable_sharing_images TEXT',
            'thread_id TEXT',
            'thread_subject TEXT',
            'thread_lastpost_time TEXT',
            'thread_lastpost_user_id TEXT',
            'thread_lastpost_username TEXT',
            'thread_replies TEXT',
            'user_id TEXT',
            'username TEXT',
            'displayname TEXT',
            'subscription TEXT',
            'read_time TEXT',
            'category_collapsed_state TEXT',
            'unread INTEGER',
            'is_collapsed INTEGER',
            'parent_forum_name TEXT',
            'parent_forum_name_2 TEXT',
            'parent_forum_id_2 TEXT',
            'require_game_character BOOLEAN',
            'logo_url TEXT',
            'unread_threads INTEGER'
        ],
    },
    {
        name: 'threads',
        schema: [
            'preset_id TEXT',
            'forum_id TEXT',
            'thread_id TEXT PRIMARY KEY',
            'thread_subject TEXT',
            'thread_replies TEXT',
            'thread_views TEXT',
            'thread_type TEXT',
            'thread_status TEXT',
            'thread_user_id TEXT',
            'thread_username TEXT',
            'thread_avatar TEXT',
            'thread_lastpost_user_id TEXT',
            'thread_lastpost_username TEXT',
            'thread_lastpost_time TEXT',
            'username TEXT',
            'thread_moved_id TEXT',
            'thread_post_time TEXT',
            'url TEXT',
            'post_count TEXT',
            'category_id TEXT',
            'subscription TEXT',
            'moved_forum_id TEXT',
            'thread_hot BOOLEAN',
            'thread_new BOOLEAN',
            'replied_to BOOLEAN',
            'avatar TEXT',
            'unread_posts TEXT',
            'labels TEXT',
            'forum_name TEXT',
            'forum_description TEXT',
            'disable_voting TEXT',
            'show_signature TEXT',
            'url_cms TEXT',
            'FOREIGN KEY (forum_id) REFERENCES forums(forum_id)'
        ],
    },
    {
        name: 'posts',
        schema: [
            'post_id TEXT PRIMARY KEY',
            'forum_id TEXT',
            'thread_id TEXT',
            'post_time TEXT',
            'post_content TEXT',
            'post_content_html TEXT',
            'post_content_clean TEXT',
            'post_user_id TEXT',
            'show_signature TEXT',
            'last_edit_time TEXT',
            'post_votes TEXT',
            'post_unhidden TEXT',
            'post_admin_hidden TEXT',
            'post_locked TEXT',
            'last_edit_user TEXT',
            'votes JSON',
            'post_username TEXT',
            'avatar TEXT',
            'user_online BOOLEAN',
            'user_votes TEXT',
            'user_posts TEXT',
            'url TEXT',
            'FOREIGN KEY (forum_id) REFERENCES forums(forum_id)',
            'FOREIGN KEY (thread_id) REFERENCES threads(thread_id)'
        ],
    },

    // News
    {
        name: 'news_articles',
        schema: [
            'article_id TEXT PRIMARY KEY',
            'user_id TEXT',
            'num_comments INTEGER',
            'timestamp TEXT',
            'status TEXT',
            'title TEXT',
            'content TEXT',
            'commenting_mode TEXT',
            'ordering TEXT',
            'sticky TEXT',
            'last_updated TEXT',
            'username TEXT',
            'displayname TEXT'
        ],
    },

    // Tickets
    {
        name: 'ticket_modules',
        schema: [
            'module_name TEXT PRIMARY KEY',
            'questions JSON'
        ],
    },
    {
        name: 'tickets',
        schema: [
            'id TEXT PRIMARY KEY',
            'code TEXT',
            'site_id TEXT',
            'preset_id TEXT',
            'subject TEXT',
            'created TEXT',
            'status TEXT',
            'assignee TEXT',
            'updated TEXT',
            'requester TEXT',
            'priority TEXT',
            'extra_questions TEXT',
            'status_change TEXT',
            'email TEXT',
            'viewers BOOLEAN',
            'createdHTML TEXT',
            'updatedHTML TEXT',
            'requesterHTML TEXT',
            'assigneeText TEXT',
            'assigneeHTML TEXT',
            'priority_name TEXT',
            'replies_count INTEGER',
            'private_reply_count INTEGER',
            'has_uploads BOOLEAN'
        ],
    },
    {
        name: 'ticket_replies',
        schema: [
            'id TEXT PRIMARY KEY',
            'ticket_id TEXT',
            'preset_id TEXT',
            'sent TEXT',
            'text TEXT',
            'user_id TEXT',
            'mode TEXT',
            'origin TEXT',
            'agent TEXT',
            'userHTML TEXT',
            'createdHTML TEXT',
            'username TEXT'
        ],
    },

    // Applications
    {
        name: 'applications',
        schema: [
            'application_id TEXT PRIMARY KEY',
            'site_id TEXT',
            'preset_id TEXT',
            'title TEXT',
            'user_ip TEXT',
            'is_mine BOOLEAN',
            'can_manage BOOLEAN',
            'created TEXT',
            'updated TEXT',
            'read TEXT',
            'comments INTEGER',
            'read_comments TEXT',
            'app_comments TEXT',
            'admin_comments TEXT',
            'site_name TEXT',
            'user_id TEXT',
            'is_online BOOLEAN',
            'admin_online BOOLEAN',
            'username TEXT',
            'avatar TEXT',
            'admin_user_id TEXT',
            'admin_username TEXT',
            'admin_avatar TEXT',
            'site_logo TEXT',
            'user_data JSON',
            'is_archived BOOLEAN',
            'is_trashed BOOLEAN',
            'allow_app_comments STRING',
            'post_app_comments BOOLEAN',
            'allow_admin_comments BOOLEAN'
        ],
    },

    // Users
    {
        name: 'users',
        schema: [
            'user_id TEXT PRIMARY KEY',
            'username TEXT',
            'forum_post_count TEXT',
            'forum_votes TEXT',
            'lastseen TEXT',
            'datejoined TEXT',
            'points_total TEXT',
            'points_day TEXT',
            'points_week TEXT',
            'points_month TEXT',
            'points_forum TEXT',
            'points_purchase TEXT',
            'points_other TEXT',
            'points_spent TEXT',
            'points_decayed TEXT',
            'tags JSON',
            'points_adjusted TEXT'
        ],
    },
];