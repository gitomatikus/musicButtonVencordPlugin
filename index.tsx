/*
 * Vencord, a Discord client mod
 * Copyright (c) 2026 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { definePluginSettings } from "@api/Settings";
import ErrorBoundary from "@components/ErrorBoundary";
import { sendMessage } from "@utils/discord";
import definePlugin, { OptionType } from "@utils/types";
import { findComponentByCodeLazy } from "@webpack";
import { GuildChannelStore, SelectedGuildStore, showToast, Toasts } from "@webpack/common";
import type { PropsWithChildren } from "react";

const HeaderBarIcon = findComponentByCodeLazy(".HEADER_BAR_BADGE_TOP:", '.iconBadge,"top"');

const settings = definePluginSettings({
    channelName: {
        type: OptionType.STRING,
        description: "Name of the text channel to send messages to",
        default: "патрон"
    },
    messageContent: {
        type: OptionType.STRING,
        description: "Message content to send when clicking the button",
        default: "m!p https://open.spotify.com/playlist/3Ne7G3xWwE4CrruEtaU87L?si=61ddf4101e0d4a3d"
    }
});

function MusicIcon() {
    return (
        <svg viewBox="0 0 24 24" width={24} height={24} className="vc-music-btn-icon">
            <path fill="currentColor" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
    );
}

async function handleClick() {
    const guildId = SelectedGuildStore.getGuildId();
    if (!guildId) {
        showToast("Please select a server first", Toasts.Type.FAILURE);
        return;
    }

    const targetChannel = settings.store.channelName.toLowerCase();
    const channels = GuildChannelStore.getChannels(guildId);
    const textChannel = channels.SELECTABLE.find(
        (c: any) => c.channel?.name?.toLowerCase() === targetChannel
    );

    if (!textChannel?.channel?.id) {
        showToast(`Channel "${settings.store.channelName}" not found`, Toasts.Type.FAILURE);
        return;
    }

    try {
        await sendMessage(textChannel.channel.id, { content: settings.store.messageContent });
        showToast("Message sent!", Toasts.Type.SUCCESS);
    } catch (e) {
        console.error("[MusicButton]", e);
        showToast("Failed to send message", Toasts.Type.FAILURE);
    }
}

function MusicButton({ buttonClass }: { buttonClass: string; }) {
    return (
        <HeaderBarIcon
            className={`vc-music-btn ${buttonClass}`}
            onClick={handleClick}
            tooltip={`Send to ${settings.store.channelName}`}
            icon={() => <MusicIcon />}
        />
    );
}

export default definePlugin({
    name: "MusicButton",
    description: "Adds a music button to send a message to a configurable channel",
    authors: [{ name: "fantik", id: 245513429190705152n }],
    settings,
    patches: [
        {
            find: '?"BACK_FORWARD_NAVIGATION":',
            replacement: {
                match: /(?<=trailing:.{0,50})\i\.Fragment,\{(?=.+?className:(\i))/,
                replace: "$self.TrailingWrapper,{className:$1,"
            }
        }
    ],
    TrailingWrapper({ children, className }: PropsWithChildren<{ className: string; }>) {
        return (
            <>
                {children}
                <ErrorBoundary noop>
                    <MusicButton buttonClass={className} />
                </ErrorBoundary>
            </>
        );
    }
});
