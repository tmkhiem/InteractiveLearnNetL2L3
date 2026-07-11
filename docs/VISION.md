# Requirements Specification: Interactive Packet Travel Demonstration Site

## 1. Purpose

The site shall be a static HTML, CSS, and JavaScript learning tool that allows learners to interactively observe how a packet travels through a network.

The demonstration shall focus only on the following concepts:

* Layer 2 addressing
* Layer 3 addressing
* Encapsulation and decapsulation
* Layer 2 switching
* Layer 3 routing
* ARP lookup and ARP learning
* Routing table lookup

No additional networking concepts shall be introduced unless explicitly listed in this document.

## 2. Technical Scope

### 2.1 Platform

The site shall be implemented as a static web application using:

* HTML
* CSS
* JavaScript

The site shall not require a backend server, database, user accounts, authentication, or external runtime services.

### 2.2 Interactivity

The site shall allow learners to control or observe animated demonstrations of packets and frames moving through a network.

The animation system shall support multiple playback speeds, including at minimum:

* Slow
* Normal
* Fast

The animations shall visually show packets or frames “flying” across links from one network entity to another.

## 3. Demonstration Entities

The site shall represent the following network entities:

### 3.1 PC

A PC shall represent an end-user computer.

For the initial version:

* Each PC shall have exactly one NIC.
* Each NIC shall have a unique MAC address.
* Each PC may later display an IP address when Layer 3 is introduced.

### 3.2 NIC

A NIC shall represent a network interface.

Each NIC shall have:

* One unique MAC address
* Optionally one IP address, introduced only during Layer 3 lessons

### 3.3 Switch

A switch shall represent a Layer 2 forwarding device.

For the initial version:

* Switch ports shall be represented simply.
* Detailed switch port expansion shall be reserved for future work.
* Port MAC learning shall not be part of the main lesson and shall be placed in an appendix or future lesson.

### 3.4 Router

A router shall represent a Layer 3 routing device.

For the initial version:

* A router may have multiple NICs.
* The main scenario shall introduce one router with two NICs:
  * One NIC connected to the local switch
  * One NIC connected toward an external network or internet

### 3.5 Link

A link shall represent a connection between two entities.

For the initial version:

* Link type does not matter.
* Cable, wireless, fiber, speed, duplex, and medium-specific behavior shall be out of scope.
* Link types may be expanded in a future version.

## 4. Visual and Instructional Requirements

### 4.1 Network Visualization

The site shall visually display:

* PCs
* NICs
* MAC addresses
* IP addresses when Layer 3 is introduced
* Switches
* Routers
* Links between devices
* Frames and packets in motion
* ARP table lookups
* Routing table lookups

### 4.2 Animation Behavior

The site shall animate:

* Frame creation
* Packet creation
* Encapsulation of Layer 3 packet inside Layer 2 frame
* Decapsulation at the destination
* Frame movement across a link
* Switch forwarding
* Router forwarding
* ARP request and reply
* Routing table lookup

### 4.3 Educational Focus

The site shall explain concepts through visual sequencing and short instructional text.

The site shall avoid introducing unrelated networking topics, including but not limited to:

* NAT
* IP fragmentation
* TCP
* UDP
* DNS
* DHCP
* VLANs
* STP
* ICMP internals beyond using ping as example data
* Ethernet frame check sequence
* Switch port MAC learning, except as an appendix
* Physical-layer details

## 5. Lesson Flow and Storyboard

## 5.1 Lesson 1: Layer 2 Network Introduction

### Requirement L2-001: Initial Network Fade-In

The site shall fade in a simple local network consisting of:

* Three PCs
* One switch
* Links connecting each PC to the switch

### Requirement L2-002: MAC Address Display

The site shall show that each NIC has a unique MAC address.

Each PC shall display its NIC MAC address.

### Requirement L2-003: Layer 2 Frame Creation

The site shall demonstrate a Layer 2 frame being created by one PC.

The frame shall include:

* Source MAC address
* Destination MAC address
* Payload placeholder

### Requirement L2-004: Layer 2 Addressing

The site shall explain that MAC addresses are used to identify destination nodes at Layer 2.

The demonstration shall show the destination MAC address being used to decide where the frame should go.

### Requirement L2-005: Point-to-Point Layer 2 Delivery

The site shall animate the Layer 2 frame traveling from the source PC to the switch, then from the switch to the destination PC.

### Requirement L2-006: Broadcast and Multicast Demonstration (skip -- this will be introduced later)

The site shall demonstrate Layer 2 broadcast and multicast behavior at a simple visual level.

The explanation shall remain limited to Layer 2 addressing and delivery behavior.

### Requirement L2-007: Switch as a Layer 2 Device

The site shall show that the switch only considers Layer 2 information.

The switch shall inspect only the destination MAC address on the frame.

The switch shall not inspect Layer 3 information.

### Requirement L2-008: Switch Forwarding

The site shall demonstrate the switch forwarding the frame to the correct port leading to the destination node.

Switch MAC learning shall not be part of the main flow.

### Requirement L2-009: End of Layer 2 Section

The site shall clearly mark the end of the Layer 2-only section before introducing Layer 3.

## 5.2 Lesson 2: Introducing Layer 3

### Requirement L3-001: Zoom Out to Full Network

The site shall zoom out from the local Layer 2 view to show the whole visible network.

### Requirement L3-002: IP Address Display

The site shall introduce IP addresses in addition to MAC addresses.

Each PC shall now show:

* MAC address
* IP address

### Requirement L3-003: Layer 3 Packet Creation

The site shall return focus to one PC and show a Layer 3 packet forming inside the Layer 2 frame payload.

The Layer 3 packet shall include:

* Source IP address
* Destination IP address
* Payload placeholder

### Requirement L3-004: Encapsulation

The site shall demonstrate that the Layer 3 packet is placed inside a Layer 2 frame.

The visual representation shall make it clear that:

* The Layer 2 frame is the outer shell
* The Layer 3 packet is inside the Layer 2 payload

## 5.3 Lesson 3: Local Delivery Using ARP

### Requirement ARP-001: Local Destination Check

The site shall demonstrate local delivery between PCs on the same network.

The source PC shall determine that the destination IP address is local.

### Requirement ARP-002: ARP Table Lookup

The source PC shall look up the destination IP address in its ARP table.

If the ARP table contains the destination IP-to-MAC mapping, the PC shall use that MAC address as the Layer 2 destination.

### Requirement ARP-003: Layer 2 Frame Completion

The source PC shall complete the Layer 2 frame by setting:

* Source MAC address to its own NIC MAC address
* Destination MAC address to the destination PC’s MAC address

### Requirement ARP-004: Local Packet Travel

The completed Layer 2 frame shall travel through the switch to the destination PC.

### Requirement ARP-005: Destination Decapsulation

The destination PC shall receive the frame and begin unwrapping the layers.

The site shall show:

* The Layer 2 frame being removed
* The Layer 3 packet being revealed

### Requirement ARP-006: Empty ARP Tables

The site shall show an initial state where all three PCs have empty ARP tables.

### Requirement ARP-007: ARP Request

One randomly selected PC shall ask for the MAC address associated with a destination IP address.

The ARP request shall be presented as:

“Who has this IP? Reply to me.”

### Requirement ARP-008: ARP Reply

The PC owning the requested IP address shall reply with its MAC address.

The source PC shall update its ARP table with the learned IP-to-MAC mapping.

### Requirement ARP-009: ARP as a Layer 2 Protocol

The site shall explicitly show that ARP does not encapsulate normal Layer 3 data in this lesson.

The demonstration shall emphasize:

* ARP is addressed using MAC addresses
* ARP operates at Layer 2 for the purpose of this lesson
* ARP is used to discover the MAC address associated with an IP address

### Requirement ARP-010: Repetition of Local Delivery

The local-only delivery scenario shall be repeated three additional times to reinforce:

* ARP table lookup
* Layer 2 encapsulation
* Switch forwarding
* Layer 3 packet delivery inside a Layer 2 frame
* Destination decapsulation

## 5.4 Lesson 4: Introducing the Router

### Requirement RTR-001: Router Introduction

The site shall introduce a router connected to the existing switch.

The router shall have two NICs:

* A local-side NIC connected to the switch
* An external-side NIC connected toward the internet or another network

### Requirement RTR-002: Router MAC Discovery

One PC shall use ARP to discover the MAC address of the router’s local-side NIC.

### Requirement RTR-003: Fast-Forward ARP State

After the ARP exchange, the site shall fast-forward to a state where all PCs know:

* The router’s local IP address
* The router’s local MAC address

## 5.5 Lesson 5: Sending to an External Network

### Requirement EXT-001: Ping to External Network

The site shall demonstrate one PC running ping to a host on an external network.

Ping shall be used only as example payload data.

The lesson shall not explain ICMP internals.

### Requirement EXT-002: Layer 3 Packet Creation

The PC shall create a Layer 3 packet containing:

* Source IP address of the PC
* Destination IP address of the external host
* Ping payload placeholder

### Requirement EXT-003: Subnet Check

The PC shall check whether the destination IP address belongs to the same subnet as any of its NICs.

The result shall be:

* No, the destination IP is not local

### Requirement EXT-004: Default Gateway Selection

Because the destination IP is not local, the PC shall use its default gateway.

The PC shall look up its routing table to find the IP address of the default gateway.

### Requirement EXT-005: ARP Lookup for Gateway MAC

The PC shall look up the default gateway IP address in its ARP table.

The PC shall retrieve the MAC address of the router’s local-side NIC.

### Requirement EXT-006: Encapsulation for Router Delivery

The PC shall encapsulate the Layer 3 packet inside a Layer 2 frame.

The Layer 2 frame shall contain:

* Source MAC address of the PC
* Destination MAC address of the router’s local-side NIC

The Layer 3 packet inside the frame shall retain:

* Source IP address of the PC
* Destination IP address of the external host

### Requirement EXT-007: Key Observation: Different L2 and L3 Destinations

The site shall explicitly highlight the following observation:

The Layer 2 destination is the router, but the Layer 3 destination is not the router.

The Layer 3 destination remains the external host.

The site shall explain that this is why a router exists: it forwards packets toward other networks.

## 5.6 Lesson 6: Router Processing and Re-Encapsulation

### Requirement ROUTE-001: Router Receives Frame

The router shall receive the Layer 2 frame because the destination MAC address matches its local-side NIC.

### Requirement ROUTE-002: Router Decapsulation

The router shall remove the Layer 2 frame to inspect the Layer 3 packet.

### Requirement ROUTE-003: Router Reads Destination IP

The router shall read the destination IP address from the Layer 3 packet.

### Requirement ROUTE-004: Router Routing Table Lookup

The router shall look up the destination network in its routing table.

The routing table shall indicate that the packet must be sent out through the router’s external-side NIC.

### Requirement ROUTE-005: Router Re-Encapsulation

The router shall re-encapsulate the original Layer 3 packet inside a new Layer 2 frame.

### Requirement ROUTE-006: Layer 3 Unchanged

The site shall clearly show that the Layer 3 source and destination IP addresses do not change.

NAT shall not be introduced.

### Requirement ROUTE-007: Layer 2 Changed

The site shall clearly show that the Layer 2 frame changes when the router sends the packet onward.

The new Layer 2 frame shall use Layer 2 addresses appropriate for the next link.

### Requirement ROUTE-008: Router Sends Toward Next Hop

The router shall send the re-encapsulated frame out through its external-side NIC toward another router or external network.

The site shall explain that each routed hop creates a new Layer 2 frame for the next link while keeping the Layer 3 packet destination unchanged.

## 6. Data Model Requirements

The JavaScript application shall model the following objects at a minimum:

### 6.1 PC Object

A PC object shall include:

* ID
* Display name
* NIC list
* ARP table
* Routing table
* Position in the visual network

### 6.2 NIC Object

A NIC object shall include:

* ID
* MAC address
* Optional IP address
* Optional subnet mask or prefix
* Connected link reference

### 6.3 Switch Object

A switch object shall include:

* ID
* Display name
* Port list
* Position in the visual network

### 6.4 Router Object

A router object shall include:

* ID
* Display name
* NIC list
* ARP table
* Routing table
* Position in the visual network

### 6.5 Link Object

A link object shall include:

* ID
* Endpoint A
* Endpoint B
* Visual path data

### 6.6 Frame Object

A Layer 2 frame object shall include:

* Source MAC address
* Destination MAC address
* Payload

### 6.7 Packet Object

A Layer 3 packet object shall include:

* Source IP address
* Destination IP address
* Payload

### 6.8 ARP Table Entry

An ARP table entry shall include:

* IP address
* MAC address

### 6.9 Routing Table Entry

A routing table entry shall include:

* Destination network
* Next hop IP address, if applicable
* Outgoing interface

## 7. User Interface Requirements

### 7.1 Main Visualization Area

The site shall include a main visual area where the network topology and packet movement are displayed.

### 7.2 Explanation Panel

The site shall include an explanation panel that describes the current step in the lesson.

### 7.3 Tables Panel

The site shall display relevant ARP and routing tables when needed.

At minimum, the site shall be able to show:

* PC ARP table
* PC routing table
* Router ARP table
* Router routing table

### 7.4 Playback Controls

The site shall provide controls for:

* Start
* Pause
* Resume
* Step forward
* Reset
* Playback speed selection

### 7.5 Lesson Navigation

The site shall allow the learner to move through the lesson units in sequence.

Optional direct navigation between lessons may be provided, but the default experience shall follow the defined storyboard order.

## 8. Out of Scope

The following items shall not be included in the main demonstration:

* NAT
* IP fragmentation
* DNS
* DHCP
* TCP handshakes
* UDP behavior
* ICMP details beyond ping as sample payload
* VLANs
* STP
* Firewall behavior
* ACLs
* Wireless behavior
* Physical-layer signaling
* Ethernet error checking
* Switch MAC learning in the main lesson
* Multiple switch port behavior beyond simple forwarding
* Multiple NICs on PCs
* Link type differences
* Advanced routing protocols

## 9. Future Expansion Notes

The design should allow future expansion for:

* Multiple NICs per PC
* More detailed switch ports
* Switch MAC learning
* Link types
* More complex topologies
* Additional lesson modules

These future capabilities shall not be implemented in the initial lesson flow unless explicitly approved.

## 10. Acceptance Criteria

The implementation shall be considered complete when:

1. A learner can view a three-PC switched network.
2. Each PC shows a unique MAC address.
3. A Layer 2 frame can be animated from one PC to another through the switch.
4. Broadcast and multicast Layer 2 delivery can be demonstrated.
5. The switch is shown making forwarding decisions using only MAC addresses.
6. The Layer 2 section ends before Layer 3 is introduced.
7. IP addresses can be introduced visually after Layer 2.
8. A Layer 3 packet can be shown inside a Layer 2 frame.
9. A PC can perform an ARP table lookup.
10. Empty ARP tables can be shown.
11. ARP request and reply can be animated.
12. Local delivery using ARP can be repeated multiple times.
13. A router with two NICs can be introduced.
14. PCs can learn the router’s local MAC address.
15. A PC can send a packet to an external IP using the default gateway.
16. The PC can perform a routing table lookup.
17. The PC can encapsulate an external Layer 3 packet inside a Layer 2 frame addressed to the router.
18. The router can decapsulate the Layer 2 frame.
19. The router can inspect the Layer 3 destination IP address.
20. The router can perform a routing table lookup.
21. The router can re-encapsulate the same Layer 3 packet in a new Layer 2 frame.
22. The site clearly shows that Layer 3 source and destination IPs remain unchanged during routing.
23. The site clearly shows that Layer 2 source and destination MAC addresses change at the router.
24. The site does not introduce NAT, fragmentation, or other out-of-scope topics.