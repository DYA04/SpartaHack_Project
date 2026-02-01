// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title VolunteerLeaderboard
 * @dev Tracks donations to organizations and pays monthly rewards to top org
 * @notice Security-hardened version with reentrancy protection and access controls
 */
contract VolunteerLeaderboard {
    // ============ State Variables ============
    address public admin;
    uint256 public currentRound;
    uint256 public rewardPool;
    uint256 public rewardAmount;
    uint256 public roundStartTime;
    uint256 public constant MIN_ROUND_DURATION = 1 hours; // Minimum time before round can end

    // Reentrancy guard
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;
    uint256 private _status;

    // Org ID => total donations this round
    mapping(uint256 => uint256) public orgDonations;
    // Org ID => payout address
    mapping(uint256 => address) public orgPayoutAddress;
    // Org ID => org owner (who can set payout address)
    mapping(uint256 => address) public orgOwner;
    // Track registered org IDs
    uint256[] public registeredOrgs;
    mapping(uint256 => bool) public isOrgRegistered;
    // Track withdrawable donations per org (separate from round tracking)
    mapping(uint256 => uint256) public orgWithdrawableBalance;

    // ============ Events ============
    event Donation(uint256 indexed orgId, address indexed donor, uint256 amount);
    event RoundStarted(uint256 indexed roundId, uint256 startTime);
    event WinnerPaid(uint256 indexed roundId, uint256 indexed orgId, address payout, uint256 amount);
    event RewardPoolFunded(address indexed sponsor, uint256 amount);
    event OrgRegistered(uint256 indexed orgId, address owner, address payoutAddress);
    event OrgPayoutUpdated(uint256 indexed orgId, address oldPayout, address newPayout);
    event OrgFundsWithdrawn(uint256 indexed orgId, address recipient, uint256 amount);

    // ============ Modifiers ============
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    modifier nonReentrant() {
        require(_status != ENTERED, "ReentrancyGuard: reentrant call");
        _status = ENTERED;
        _;
        _status = NOT_ENTERED;
    }

    modifier validOrgId(uint256 orgId) {
        require(orgId > 0 && orgId <= 1000, "Invalid org ID (1-1000)");
        _;
    }

    // ============ Constructor ============
    constructor(uint256 _rewardAmount) {
        require(_rewardAmount > 0, "Reward must be > 0");
        admin = msg.sender;
        currentRound = 1;
        rewardAmount = _rewardAmount;
        roundStartTime = block.timestamp;
        _status = NOT_ENTERED;
    }

    // ============ Public Functions ============

    /**
     * @dev Donate ETH to an organization
     * @param orgId The organization ID to donate to
     */
    function donate(uint256 orgId) external payable validOrgId(orgId) nonReentrant {
        require(msg.value > 0, "Must send ETH");
        require(msg.value <= 100 ether, "Donation too large"); // Sanity cap

        // Auto-register org if not registered (first donor becomes temp owner)
        if (!isOrgRegistered[orgId]) {
            registeredOrgs.push(orgId);
            isOrgRegistered[orgId] = true;
            orgOwner[orgId] = msg.sender; // First donor is temp owner until claimed
            emit OrgRegistered(orgId, msg.sender, address(0));
        }

        // Update donation tracking (checked math in 0.8+)
        orgDonations[orgId] += msg.value;
        orgWithdrawableBalance[orgId] += msg.value;

        emit Donation(orgId, msg.sender, msg.value);
    }

    /**
     * @dev Register an organization (admin only for hackathon simplicity)
     * @param orgId The organization ID
     * @param owner The owner address who can manage the org
     * @param payout The payout address for rewards
     */
    function registerOrg(
        uint256 orgId,
        address owner,
        address payout
    ) external onlyAdmin validOrgId(orgId) {
        require(owner != address(0), "Invalid owner");
        require(payout != address(0), "Invalid payout address");
        require(!isOrgRegistered[orgId], "Org already registered");

        registeredOrgs.push(orgId);
        isOrgRegistered[orgId] = true;
        orgOwner[orgId] = owner;
        orgPayoutAddress[orgId] = payout;

        emit OrgRegistered(orgId, owner, payout);
    }

    /**
     * @dev Set payout address for an organization (only org owner or admin)
     * @param orgId The organization ID
     * @param payout The new payout address
     */
    function setOrgPayout(uint256 orgId, address payout) external validOrgId(orgId) {
        require(payout != address(0), "Invalid payout address");
        require(isOrgRegistered[orgId], "Org not registered");
        require(
            msg.sender == orgOwner[orgId] || msg.sender == admin,
            "Not org owner or admin"
        );

        address oldPayout = orgPayoutAddress[orgId];
        orgPayoutAddress[orgId] = payout;

        emit OrgPayoutUpdated(orgId, oldPayout, payout);
    }

    /**
     * @dev Transfer org ownership (only current owner or admin)
     * @param orgId The organization ID
     * @param newOwner The new owner address
     */
    function transferOrgOwnership(uint256 orgId, address newOwner) external validOrgId(orgId) {
        require(newOwner != address(0), "Invalid new owner");
        require(isOrgRegistered[orgId], "Org not registered");
        require(
            msg.sender == orgOwner[orgId] || msg.sender == admin,
            "Not org owner or admin"
        );

        orgOwner[orgId] = newOwner;
    }

    /**
     * @dev Fund the reward pool (sponsors call this)
     */
    function fundRewardPool() external payable nonReentrant {
        require(msg.value > 0, "Must send ETH");
        rewardPool += msg.value;
        emit RewardPoolFunded(msg.sender, msg.value);
    }

    // ============ Admin Functions ============

    /**
     * @dev Start a new round (admin only) - resets round donations
     * @notice Enforces minimum round duration to prevent manipulation
     */
    function startNewRound() external onlyAdmin {
        require(
            block.timestamp >= roundStartTime + MIN_ROUND_DURATION,
            "Round minimum duration not met"
        );

        // Reset all org donations for the new round
        for (uint256 i = 0; i < registeredOrgs.length; i++) {
            orgDonations[registeredOrgs[i]] = 0;
        }

        currentRound++;
        roundStartTime = block.timestamp;

        emit RoundStarted(currentRound, block.timestamp);
    }

    /**
     * @dev Find winner and pay reward (admin only)
     * @notice Uses checks-effects-interactions pattern for reentrancy safety
     */
    function selectWinnerAndPayoutTop() external onlyAdmin nonReentrant {
        require(rewardPool >= rewardAmount, "Insufficient reward pool");
        require(registeredOrgs.length > 0, "No orgs registered");
        require(
            block.timestamp >= roundStartTime + MIN_ROUND_DURATION,
            "Round minimum duration not met"
        );

        // Find org with max donations
        uint256 winningOrgId = 0;
        uint256 maxDonations = 0;

        for (uint256 i = 0; i < registeredOrgs.length; i++) {
            uint256 orgId = registeredOrgs[i];
            if (orgDonations[orgId] > maxDonations) {
                maxDonations = orgDonations[orgId];
                winningOrgId = orgId;
            }
        }

        require(winningOrgId > 0 && maxDonations > 0, "No donations this round");

        address payoutAddr = orgPayoutAddress[winningOrgId];
        require(payoutAddr != address(0), "Winner has no payout address");

        // Effects: Update state BEFORE external call
        uint256 payoutAmount = rewardAmount;
        rewardPool -= payoutAmount;

        // Interaction: External call AFTER state updates
        (bool success, ) = payoutAddr.call{value: payoutAmount}("");
        require(success, "Payout failed");

        emit WinnerPaid(currentRound, winningOrgId, payoutAddr, payoutAmount);
    }

    /**
     * @dev Withdraw accumulated donations for an org (admin only)
     * @param orgId The organization ID
     * @notice Properly tracks withdrawable balance separately from round donations
     */
    function withdrawOrgFunds(uint256 orgId) external onlyAdmin nonReentrant validOrgId(orgId) {
        require(isOrgRegistered[orgId], "Org not registered");

        address payoutAddr = orgPayoutAddress[orgId];
        require(payoutAddr != address(0), "No payout address set");

        uint256 amount = orgWithdrawableBalance[orgId];
        require(amount > 0, "No funds to withdraw");

        // Effects: Update state BEFORE external call
        orgWithdrawableBalance[orgId] = 0;

        // Interaction: External call AFTER state updates
        (bool success, ) = payoutAddr.call{value: amount}("");
        require(success, "Withdrawal failed");

        emit OrgFundsWithdrawn(orgId, payoutAddr, amount);
    }

    /**
     * @dev Update reward amount (admin only)
     * @param _amount New reward amount in wei
     */
    function setRewardAmount(uint256 _amount) external onlyAdmin {
        require(_amount > 0, "Reward must be > 0");
        rewardAmount = _amount;
    }

    /**
     * @dev Transfer admin role
     * @param newAdmin New admin address
     */
    function transferAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid admin address");
        admin = newAdmin;
    }

    /**
     * @dev Emergency withdraw from reward pool (admin only)
     * @param amount Amount to withdraw
     * @param recipient Recipient address
     */
    function emergencyWithdrawPool(
        uint256 amount,
        address recipient
    ) external onlyAdmin nonReentrant {
        require(recipient != address(0), "Invalid recipient");
        require(amount <= rewardPool, "Exceeds pool balance");

        rewardPool -= amount;

        (bool success, ) = recipient.call{value: amount}("");
        require(success, "Withdrawal failed");
    }

    // ============ View Functions ============

    /**
     * @dev Get donations for an org in current round
     */
    function getOrgDonations(uint256 orgId) external view returns (uint256) {
        return orgDonations[orgId];
    }

    /**
     * @dev Get all registered org IDs
     */
    function getRegisteredOrgs() external view returns (uint256[] memory) {
        return registeredOrgs;
    }

    /**
     * @dev Get number of registered orgs
     */
    function getRegisteredOrgsCount() external view returns (uint256) {
        return registeredOrgs.length;
    }

    /**
     * @dev Get leaderboard data for multiple orgs
     * @param orgIds Array of org IDs to query
     * @return donations Array of donation amounts
     */
    function getLeaderboard(
        uint256[] calldata orgIds
    ) external view returns (uint256[] memory donations) {
        donations = new uint256[](orgIds.length);
        for (uint256 i = 0; i < orgIds.length; i++) {
            donations[i] = orgDonations[orgIds[i]];
        }
    }

    /**
     * @dev Get org details
     * @param orgId The organization ID
     */
    function getOrgDetails(uint256 orgId) external view returns (
        bool registered,
        address owner,
        address payout,
        uint256 roundDonations,
        uint256 withdrawable
    ) {
        return (
            isOrgRegistered[orgId],
            orgOwner[orgId],
            orgPayoutAddress[orgId],
            orgDonations[orgId],
            orgWithdrawableBalance[orgId]
        );
    }

    /**
     * @dev Get current round info
     */
    function getRoundInfo() external view returns (
        uint256 roundId,
        uint256 startTime,
        uint256 minEndTime,
        uint256 poolBalance,
        uint256 reward
    ) {
        return (
            currentRound,
            roundStartTime,
            roundStartTime + MIN_ROUND_DURATION,
            rewardPool,
            rewardAmount
        );
    }

    /**
     * @dev Get contract ETH balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev Check if round can be ended
     */
    function canEndRound() external view returns (bool) {
        return block.timestamp >= roundStartTime + MIN_ROUND_DURATION;
    }

    // ============ Receive ============

    /**
     * @dev Receive ETH directly adds to reward pool
     */
    receive() external payable {
        rewardPool += msg.value;
        emit RewardPoolFunded(msg.sender, msg.value);
    }
}
