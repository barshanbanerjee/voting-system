# Institutional LAN Voting System: Deployment & Testing Guide

This guide explains how to set up your multi-device voting environment using a central server, mobile kiosks, and administrative desktop units.

---

## 1. Server Configuration (The Host)

The server must be running on your **Main Laptop/Computer** and must be visible to the entire local network.

### Step 1: Find your Local IP
Open your terminal on the host machine and run:
```bash
ipconfig getifaddr en0
```
*Note: It will return a number like `192.168.1.50`. This is your **Host IP**.*

### Step 2: Launch the Network-Visible Server
You must bind the server to `0.0.0.0` so other devices can "see" it:
```bash
npx next dev -H 0.0.0.0
```
*Your server is now accessible at `http://[Host-IP]:3000`.*

---

## 2. Testing from Mobile (Unregistered Device)

Use your mobile phone to verify the **Hardware Identification System**.

1.  **Open URL**: On your phone, go to `http://[Host-IP]:3000/vote`.
2.  **Verification**: You should see a dark **"Unauthorized Device"** screen.
3.  **Audit**: Note the IP address shown on your phone screen.
4.  **Authorization**: 
    *   On your **Mac**, go to `/admin/terminals`.
    *   Register your Phone's IP.
    *   Refresh your phone; it will now be unlocked for voting.

---

## 3. Testing from Desktop (Kiosk Mode)

For a dedicated voting station on your desktop, use **Chrome Kiosk Mode** to lock the browser.

### Windows (Command Prompt)
```cmd
"C:\Program Files\Google\Chrome\Application\chrome.exe" --kiosk --incognito http://[Host-IP]:3000/vote
```

### Mac (Terminal)
```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --kiosk --incognito http://[Host-IP]:3000/vote
```

---

## 4. Administrative Security Audit

### Total Lockdown Test
On any registered terminal (except those named "ADMIN"), try the following:
*   **Keyboard Test**: Press any key on a physical keyboard. The screen should immediately lock with a **Red Security Alert**.
*   **Context Menu**: Right-click anywhere. It should be disabled.
*   **Virtual Input**: Use the on-screen Numpad and Keyboard to navigate.

### Activity Monitoring
While someone is voting on a terminal, watch the **Admin Sidebar**:
*   A **Blue Pulse** will appear next to **Live Monitor** when a session is pending.
*   A **Red Pulse** will appear next to **Terminals** if a tamper event occurs.

---

## 5. Troubleshooting Connectivity

If your phone or desktop says "Site cannot be reached":
1.  **Firewall**: Disable the Mac Firewall temporarily (**System Settings > Network > Firewall > OFF**).
2.  **Isolation**: Ensure your router does not have "AP Isolation" or "Guest Mode" enabled.
3.  **VPN**: Disable any VPNs on both the server and the client devices.
